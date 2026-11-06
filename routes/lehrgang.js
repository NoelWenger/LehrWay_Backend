import express from 'express'
import {
    auditPool as pool,
    runAudited,
} from '../audit.js'

const router = express.Router()

// Unterstützt auch die bestehenden Lehrgänge mit acht Semestern.
// Die tatsächliche Grenze wird pro Lehrgang geprüft.
const MAX_QUARTERS = 16

function fail(status, message) {
    const error = new Error(message)
    error.status = status
    throw error
}

function validId(value, label = 'ID') {
    const text = String(value ?? '')

    if (!/^[1-9]\d*$/.test(text)) {
        fail(400, `${label} ist ungültig.`)
    }

    const id = Number(text)

    if (!Number.isSafeInteger(id)) {
        fail(400, `${label} ist ungültig.`)
    }

    return id
}

function validInteger(value, min, max, message) {
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < min ||
        value > max
    ) {
        fail(400, message)
    }

    return value
}

function validName(value, maxLength, message) {
    if (typeof value !== 'string') {
        fail(400, message)
    }

    const name = value.trim()

    if (!name || Array.from(name).length > maxLength) {
        fail(400, message)
    }

    return name
}

function validLessons(value) {
    return validInteger(
        value,
        0,
        2147483647,
        'Bitte eine gültige, nicht negative Lektionszahl eingeben.',
    )
}

function validQuarter(value) {
    return validInteger(
        value,
        1,
        MAX_QUARTERS,
        'Ungültiges Quartal.',
    )
}

function toDBQuarter(startQuarter) {
    const lehrjahr = Math.floor((startQuarter - 1) / 4) + 1
    const quartal = ((startQuarter - 1) % 4) + 1
    const semester =
        (lehrjahr - 1) * 2 + Math.ceil(quartal / 2)

    return { lehrjahr, semester, quartal }
}

function sendJson(res, data, status = 200) {
    const body = JSON.stringify(data, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
    )

    return res.status(status).type('application/json').send(body)
}

function sendError(res, error) {
    if (error.status) {
        return res.status(error.status).json({
            message: error.message,
        })
    }

    console.error('Lehrgang-API:', error)

    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            message: 'Dieser Eintrag existiert bereits.',
        })
    }

    if (
        error.code === 'ER_ROW_IS_REFERENCED_2' ||
        error.code === 'ER_NO_REFERENCED_ROW_2'
    ) {
        return res.status(409).json({
            message:
                'Eine Datenbankverknüpfung verhindert die Änderung. ' +
                'Der Lehrgang könnte beispielsweise noch von Klassen verwendet werden.',
        })
    }

    return res.status(500).json({
        message:
            'Ein Datenbankfehler ist aufgetreten. ' +
            'Weitere Informationen stehen in der Backend-Ausgabe.',
    })
}

function route(handler) {
    return async (req, res) => {
        try {
            await runAudited(
                req,
                res,
                handler,
            )
        } catch (error) {
            sendError(res, error)
        }
    }
}

async function transaction(handler) {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const result = await handler(connection)

        await connection.commit()

        return result
    } catch (error) {
        try {
            await connection.rollback()
        } catch (rollbackError) {
            console.error('Rollback fehlgeschlagen:', rollbackError)
        }

        throw error
    } finally {
        connection.release()
    }
}

async function requireCourse(connection, courseId) {
    const rows = await connection.query(
        `SELECT id, semesteranzahl
         FROM lehrgang
         WHERE id = ?
         FOR UPDATE`,
        [courseId],
    )

    if (rows.length === 0) {
        fail(404, 'Lehrgang nicht gefunden.')
    }

    return rows[0]
}

// Änderungen am gleichen Lehrgang werden nacheinander ausgeführt.
async function withLockedField(fieldId, handler) {
    return transaction(async connection => {
        const initialRows = await connection.query(
            'SELECT lehrgang_id FROM lehrgang_modul WHERE id = ?',
            [fieldId],
        )

        if (initialRows.length === 0) {
            fail(404, 'Quartalsfeld nicht gefunden.')
        }

        const courseId = initialRows[0].lehrgang_id

        await requireCourse(connection, courseId)

        const rows = await connection.query(
            `SELECT id, bezeichnung, lehrgang_id,
                    lehrjahr, semester, quartal,
                    quartal_span, lektionen
             FROM lehrgang_modul
             WHERE id = ?
                 FOR UPDATE`,
            [fieldId],
        )

        if (rows.length === 0) {
            fail(404, 'Quartalsfeld nicht gefunden.')
        }

        const field = rows[0]

        if (Number(field.lehrgang_id) !== Number(courseId)) {
            fail(
                409,
                'Das Feld wurde zwischenzeitlich geändert. Bitte neu laden.',
            )
        }

        return handler(connection, field)
    })
}

async function ensureRangeAvailable(
    connection,
    courseId,
    moduleName,
    startQuarter,
    endQuarter,
    ignoredFieldId = 0,
) {
    const course = await requireCourse(connection, courseId)
    const quarterCount = Number(course.semesteranzahl) * 2

    if (
        !Number.isInteger(startQuarter) ||
        !Number.isInteger(endQuarter) ||
        startQuarter < 1 ||
        endQuarter < startQuarter ||
        endQuarter > quarterCount
    ) {
        fail(
            400,
            `Der Bereich muss innerhalb von Q1 bis Q${quarterCount} liegen.`,
        )
    }

    const rows = await connection.query(
        `SELECT id, lehrjahr, quartal, quartal_span
         FROM lehrgang_modul
         WHERE lehrgang_id = ?
           AND LOWER(TRIM(bezeichnung)) = LOWER(TRIM(?))
           AND id <> ?
         FOR UPDATE`,
        [courseId, moduleName, ignoredFieldId],
    )

    const overlaps = rows.some(field => {
        const fieldStart =
            (Number(field.lehrjahr) - 1) * 4 +
            Number(field.quartal)

        const fieldEnd =
            fieldStart + Number(field.quartal_span ?? 1) - 1

        return startQuarter <= fieldEnd && endQuarter >= fieldStart
    })

    if (overlaps) {
        fail(
            409,
            'Der Bereich überschneidet sich mit einem anderen Feld.',
        )
    }
}

// Lehrgänge laden
router.get('/lehrgaenge', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT id, bezeichnung, semesteranzahl
         FROM lehrgang
         ORDER BY bezeichnung`,
    )

    sendJson(res, rows)
}))

// Lehrgang erstellen
router.post('/lehrgaenge', route(async (req, res) => {
    const name = validName(
        req.body?.bezeichnung,
        255,
        'Bitte einen Lehrgangsnamen mit 1 bis 255 Zeichen eingeben.',
    )

    const semesters = req.body?.semesteranzahl

    if (![2, 4, 6, 8].includes(semesters)) {
        fail(400, 'Bitte 2, 4, 6 oder 8 Semester auswählen.')
    }

    const existing = await pool.query(
        `SELECT id
         FROM lehrgang
         WHERE LOWER(TRIM(bezeichnung)) = LOWER(?)
         LIMIT 1`,
        [name],
    )

    if (existing.length > 0) {
        fail(409, 'Dieser Lehrgang existiert bereits.')
    }

    const result = await pool.query(
        `INSERT INTO lehrgang (bezeichnung, semesteranzahl)
         VALUES (?, ?)`,
        [name, semesters],
    )

    sendJson(res, {
        id: result.insertId,
        bezeichnung: name,
        semesteranzahl: semesters,
    }, 201)
}))

// Name und Semesterzahl gemeinsam bearbeiten
router.put('/lehrgaenge/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Lehrgang-ID')

    const name = validName(
        req.body?.bezeichnung,
        255,
        'Bitte einen Lehrgangsnamen mit 1 bis 255 Zeichen eingeben.',
    )

    await transaction(async connection => {
        const course = await requireCourse(connection, id)

        const currentSemesters = Number(course.semesteranzahl)
        const semesters =
            req.body?.semesteranzahl ?? currentSemesters

        // Bestehende acht Semester dürfen beibehalten werden.
        if (
            ![2, 4, 6, 8].includes(semesters) &&
            semesters !== currentSemesters
        ) {
            fail(400, 'Bitte 2, 4 oder 6 Semester auswählen.')
        }

        if (semesters < currentSemesters) {
            const fields = await connection.query(
                `SELECT lehrjahr, quartal, quartal_span
                 FROM lehrgang_modul
                 WHERE lehrgang_id = ?
                 FOR UPDATE`,
                [id],
            )

            const outside = fields.some(field => {
                const start =
                    (Number(field.lehrjahr) - 1) * 4 +
                    Number(field.quartal)

                const end =
                    start + Number(field.quartal_span ?? 1) - 1

                return end > semesters * 2
            })

            if (outside) {
                fail(
                    409,
                    'Die Dauer kann nicht verkürzt werden: ' +
                    'Verschiebe oder verkürze zuerst die Felder hinter Q' +
                    semesters * 2 +
                    '.',
                )
            }
        }

        const existing = await connection.query(
            `SELECT id
             FROM lehrgang
             WHERE LOWER(TRIM(bezeichnung)) = LOWER(?)
               AND id <> ?
             LIMIT 1`,
            [name, id],
        )

        if (existing.length > 0) {
            fail(409, 'Dieser Lehrgang existiert bereits.')
        }

        await connection.query(
            `UPDATE lehrgang
             SET bezeichnung = ?, semesteranzahl = ?
             WHERE id = ?`,
            [name, semesters, id],
        )
    })

    res.json({
        id,
        bezeichnung: name,
    })
}))

// Lehrgang löschen
router.delete('/lehrgaenge/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Lehrgang-ID')

    await transaction(async connection => {
        await requireCourse(connection, id)

        await connection.query(
            'DELETE FROM lehrgang_modul WHERE lehrgang_id = ?',
            [id],
        )

        // Bei referenzierenden Klassen oder Logs schlägt das Löschen
        // fehl. Die Transaktion stellt dann auch die Module wieder her.
        await connection.query(
            'DELETE FROM lehrgang WHERE id = ?',
            [id],
        )
    })

    res.json({ success: true })
}))

// Module und Quartalsfelder laden
router.get('/lehrgaenge/:id/module', route(async (req, res) => {
    const courseId = validId(req.params.id, 'Lehrgang-ID')

    const rows = await pool.query(
        `SELECT id, bezeichnung, lehrjahr, semester,
                quartal, quartal_span, lektionen, lehrgang_id
         FROM lehrgang_modul
         WHERE lehrgang_id = ?
         ORDER BY bezeichnung, lehrjahr, quartal, id`,
        [courseId],
    )

    sendJson(res, rows)
}))

// Neues Modul beziehungsweise Quartalsfeld
router.post('/lehrgaenge/:id/module', route(async (req, res) => {
    const courseId = validId(req.params.id, 'Lehrgang-ID')

    const name = validName(
        req.body?.bezeichnung,
        50,
        'Bitte einen Modulnamen mit 1 bis 50 Zeichen eingeben.',
    )

    const year = validInteger(
        req.body?.lehrjahr,
        1,
        4,
        'Das Lehrjahr muss zwischen 1 und 4 liegen.',
    )

    const quarter = validInteger(
        req.body?.quartal,
        1,
        4,
        'Das Quartal innerhalb des Lehrjahrs muss zwischen 1 und 4 liegen.',
    )

    const span = validInteger(
        req.body?.quartal_span ?? 1,
        1,
        MAX_QUARTERS,
        'Ungültige Quartalslänge.',
    )

    const lessons = validLessons(req.body?.lektionen ?? 0)

    const startQuarter = (year - 1) * 4 + quarter
    const endQuarter = startQuarter + span - 1
    const position = toDBQuarter(startQuarter)

    const created = await transaction(async connection => {
        await requireCourse(connection, courseId)

        await ensureRangeAvailable(
            connection,
            courseId,
            name,
            startQuarter,
            endQuarter,
        )

        const result = await connection.query(
            `INSERT INTO lehrgang_modul
             (bezeichnung, lehrjahr, semester, quartal,
              quartal_span, lektionen, lehrgang_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                position.lehrjahr,
                position.semester,
                position.quartal,
                span,
                lessons,
                courseId,
            ],
        )

        return {
            id: result.insertId,
            bezeichnung: name,
            ...position,
            quartal_span: span,
            lektionen: lessons,
            lehrgang_id: courseId,
        }
    })

    sendJson(res, created, 201)
}))

// Modulname ändern.
// Alle gleich benannten Felder dieses Lehrgangs gehören zum Modul.
router.patch('/lehrgang-module/:id/name', route(async (req, res) => {
    const id = validId(req.params.id, 'Modul-ID')

    const name = validName(
        req.body?.bezeichnung,
        50,
        'Bitte einen Modulnamen mit 1 bis 50 Zeichen eingeben.',
    )

    await withLockedField(id, async (connection, field) => {
        const existing = await connection.query(
            `SELECT id
             FROM lehrgang_modul
             WHERE lehrgang_id = ?
               AND LOWER(TRIM(bezeichnung)) = LOWER(TRIM(?))
               AND LOWER(TRIM(bezeichnung)) <> LOWER(TRIM(?))
             LIMIT 1
             FOR UPDATE`,
            [field.lehrgang_id, name, field.bezeichnung],
        )

        if (existing.length > 0) {
            fail(409, 'Dieses Modul existiert bereits.')
        }

        await connection.query(
            `UPDATE lehrgang_modul
             SET bezeichnung = ?
             WHERE lehrgang_id = ?
               AND LOWER(TRIM(bezeichnung)) = LOWER(TRIM(?))`,
            [name, field.lehrgang_id, field.bezeichnung],
        )
    })

    res.json({
        success: true,
        bezeichnung: name,
    })
}))

// Bisherige Route: nur Lektionen bearbeiten
router.put('/lehrgang-module/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Feld-ID')
    const lessons = validLessons(req.body?.lektionen)

    await withLockedField(id, async connection => {
        await connection.query(
            'UPDATE lehrgang_modul SET lektionen = ? WHERE id = ?',
            [lessons, id],
        )
    })

    res.json({
        id,
        lektionen: lessons,
    })
}))

// Drag-and-drop: Position ändern
router.patch('/lehrgang-module/:id/position', route(async (req, res) => {
    const id = validId(req.params.id, 'Feld-ID')
    const startQuarter = validQuarter(req.body?.startQuarter)

    const updated = await withLockedField(
        id,
        async (connection, field) => {
            const quarterSpan = validInteger(
                Number(field.quartal_span ?? 1),
                1,
                MAX_QUARTERS,
                'Die gespeicherte Quartalslänge ist ungültig.',
            )

            const endQuarter = startQuarter + quarterSpan - 1

            await ensureRangeAvailable(
                connection,
                field.lehrgang_id,
                field.bezeichnung,
                startQuarter,
                endQuarter,
                id,
            )

            const position = toDBQuarter(startQuarter)

            await connection.query(
                `UPDATE lehrgang_modul
                 SET lehrjahr = ?, semester = ?, quartal = ?
                 WHERE id = ?`,
                [
                    position.lehrjahr,
                    position.semester,
                    position.quartal,
                    id,
                ],
            )

            return {
                id,
                startQuarter,
                endQuarter,
                quarterSpan,
                ...position,
            }
        },
    )

    sendJson(res, updated)
}))

// Quartalsbereich und Lektionen gemeinsam bearbeiten
router.patch('/lehrgang-module/:id/bereich', route(async (req, res) => {
    const id = validId(req.params.id, 'Feld-ID')
    const startQuarter = validQuarter(req.body?.startQuarter)
    const endQuarter = validQuarter(req.body?.endQuarter)
    const lessons = validLessons(req.body?.lessons)

    if (endQuarter < startQuarter) {
        fail(400, 'Das Endquartal darf nicht vor dem Startquartal liegen.')
    }

    const updated = await withLockedField(
        id,
        async (connection, field) => {
            await ensureRangeAvailable(
                connection,
                field.lehrgang_id,
                field.bezeichnung,
                startQuarter,
                endQuarter,
                id,
            )

            const quarterSpan = endQuarter - startQuarter + 1
            const position = toDBQuarter(startQuarter)

            await connection.query(
                `UPDATE lehrgang_modul
                 SET lehrjahr = ?,
                     semester = ?,
                     quartal = ?,
                     quartal_span = ?,
                     lektionen = ?
                 WHERE id = ?`,
                [
                    position.lehrjahr,
                    position.semester,
                    position.quartal,
                    quarterSpan,
                    lessons,
                    id,
                ],
            )

            return {
                id,
                startQuarter,
                endQuarter,
                quarterSpan,
                lessons,
            }
        },
    )

    sendJson(res, updated)
}))

// Quartalsfeld löschen
router.delete('/lehrgang-module/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Feld-ID')

    await withLockedField(id, async connection => {
        await connection.query(
            'DELETE FROM lehrgang_modul WHERE id = ?',
            [id],
        )
    })

    res.json({ success: true })
}))

export default router