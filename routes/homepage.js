import express from 'express'
import pool from '../db.js'

const router = express.Router()

const weekdays = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
]

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

function validClassName(value) {
    if (typeof value !== 'string' || !value.trim()) {
        fail(400, 'Bitte einen Klassennamen eingeben.')
    }

    const name = value.trim()

    // klasse.bezeichnung ist laut DDL VARCHAR(50).
    if (Array.from(name).length > 50) {
        fail(400, 'Der Klassenname darf höchstens 50 Zeichen lang sein.')
    }

    return name
}

function validCapacity(value) {
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 2147483647
    ) {
        fail(400, 'Bitte eine gültige, nicht negative Raumanzahl eingeben.')
    }

    return value
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

    console.error('Homepage-API:', error)

    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            message: 'Dieser Name oder diese Zuordnung existiert bereits.',
        })
    }

    if (
        error.code === 'ER_NO_REFERENCED_ROW_2' ||
        error.code === 'ER_ROW_IS_REFERENCED_2'
    ) {
        return res.status(409).json({
            message:
                'Eine verknüpfte Datenbankzeile fehlt oder verhindert die Änderung.',
        })
    }

    return res.status(500).json({
        message:
            'Datenbankfehler. Weitere Informationen stehen in der Backend-Ausgabe.',
    })
}

// Fängt Fehler auch bei Express 4 zuverlässig ab.
function route(handler) {
    return async (req, res) => {
        try {
            await handler(req, res)
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

async function requireClass(connection, id) {
    const rows = await connection.query(
        'SELECT id FROM klasse WHERE id = ? FOR UPDATE',
        [id],
    )

    if (rows.length === 0) {
        fail(404, 'Klasse nicht gefunden.')
    }
}

async function requireResource(connection, id) {
    const rows = await connection.query(
        'SELECT id FROM ressourcen WHERE id = ? FOR UPDATE',
        [id],
    )

    if (rows.length === 0) {
        fail(404, 'Ressource nicht gefunden.')
    }
}

async function checkDuplicateClass(connection, name, excludedId = 0) {
    const rows = await connection.query(
        `SELECT id
     FROM klasse
     WHERE LOWER(TRIM(bezeichnung)) = LOWER(?)
       AND id <> ?
     LIMIT 1`,
        [name, excludedId],
    )

    if (rows.length > 0) {
        fail(409, 'Eine Klasse mit diesem Namen existiert bereits.')
    }
}

async function updateSchoolDayCount(connection, classId) {
    await connection.query(
        `UPDATE klasse
     SET anzahl_schultage_woche = (
       SELECT COUNT(DISTINCT ressourcen_id)
       FROM klasse_ressource
       WHERE klasse_id = ?
     )
     WHERE id = ?`,
        [classId, classId],
    )
}

// --------------------------------------------------
// Klassen
// --------------------------------------------------

router.get('/klassen', route(async (_req, res) => {
    // Der mariadb-Treiber liefert die Zeilen direkt.
    const rows = await pool.query(
        `SELECT id, bezeichnung, lehrgang_id
     FROM klasse
     ORDER BY bezeichnung`,
    )

    sendJson(res, rows)
}))

router.post('/klassen', route(async (req, res) => {
    const name = validClassName(req.body?.bezeichnung)
    const courseId = validId(req.body?.lehrgang_id, 'Lehrgang-ID')

    const created = await transaction(async (connection) => {
        const courses = await connection.query(
            'SELECT id FROM lehrgang WHERE id = ? LOCK IN SHARE MODE',
            [courseId],
        )

        if (courses.length === 0) {
            fail(404, 'Der ausgewählte Lehrgang existiert nicht mehr.')
        }

        await checkDuplicateClass(connection, name)

        const result = await connection.query(
            `INSERT INTO klasse
       (bezeichnung, lehrgang_id, notizen, anzahl_schultage_woche)
       VALUES (?, ?, NULL, 0)`,
            [name, courseId],
        )

        const classId = result.insertId

        // Gleiche Modulübernahme wie in deinem DML.
        // klasse_modul besitzt laut DDL keine Spalte quartal_span.
        await connection.query(
            `INSERT INTO klasse_modul
       (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
       SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, ?
       FROM lehrgang_modul
       WHERE lehrgang_id = ?`,
            [classId, courseId],
        )

        return {
            id: classId,
            bezeichnung: name,
            lehrgang_id: courseId,
        }
    })

    sendJson(res, created, 201)
}))

router.put('/klassen/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Klassen-ID')
    const name = validClassName(req.body?.bezeichnung)

    await transaction(async (connection) => {
        await requireClass(connection, id)
        await checkDuplicateClass(connection, name, id)

        await connection.query(
            'UPDATE klasse SET bezeichnung = ? WHERE id = ?',
            [name, id],
        )
    })

    res.json({
        id,
        bezeichnung: name,
    })
}))

router.delete('/klassen/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Klassen-ID')

    await transaction(async (connection) => {
        await requireClass(connection, id)

        // Erst alle abhängigen Datensätze entfernen.
        await connection.query(
            'DELETE FROM regel WHERE klasse_a_id = ? OR klasse_b_id = ?',
            [id, id],
        )

        await connection.query(
            'DELETE FROM klasse_ressource WHERE klasse_id = ?',
            [id],
        )

        await connection.query(
            'DELETE FROM klasse_label WHERE klasse_id = ?',
            [id],
        )

        await connection.query(
            'DELETE FROM klasse_modul WHERE klasse_id = ?',
            [id],
        )

        await connection.query(
            'DELETE FROM klasse WHERE id = ?',
            [id],
        )
    })

    res.json({ success: true })
}))

// --------------------------------------------------
// Räume
// --------------------------------------------------

router.get('/ressourcen', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT id, wochentag, anzahl_raeume
     FROM ressourcen
     ORDER BY id`,
    )

    sendJson(res, rows)
}))

router.post('/ressourcen', route(async (req, res) => {
    const day = req.body?.wochentag
    const capacity = validCapacity(req.body?.anzahl_raeume)

    if (!weekdays.includes(day)) {
        fail(400, 'Ungültiger Wochentag.')
    }

    const created = await transaction(async (connection) => {
        const existing = await connection.query(
            'SELECT id FROM ressourcen WHERE wochentag = ?',
            [day],
        )

        if (existing.length > 0) {
            fail(409, 'Für diesen Wochentag existiert bereits ein Raumeintrag.')
        }

        const result = await connection.query(
            `INSERT INTO ressourcen (wochentag, anzahl_raeume)
       VALUES (?, ?)`,
            [day, capacity],
        )

        return {
            id: result.insertId,
            wochentag: day,
            anzahl_raeume: capacity,
        }
    })

    sendJson(res, created, 201)
}))

router.put('/ressourcen/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Ressourcen-ID')
    const capacity = validCapacity(req.body?.anzahl_raeume)

    await transaction(async (connection) => {
        await requireResource(connection, id)

        await connection.query(
            'UPDATE ressourcen SET anzahl_raeume = ? WHERE id = ?',
            [capacity, id],
        )
    })

    res.json({
        id,
        anzahl_raeume: capacity,
    })
}))

// --------------------------------------------------
// Schultage
//
// API-Pfad: /klasse-ressourcen
// SQL-Tabelle: klasse_ressource
// --------------------------------------------------

router.get('/klasse-ressourcen', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT DISTINCT klasse_id, ressourcen_id
     FROM klasse_ressource
     ORDER BY klasse_id, ressourcen_id`,
    )

    sendJson(res, rows)
}))

router.post('/klasse-ressourcen', route(async (req, res) => {
    const classId = validId(req.body?.klasse_id, 'Klassen-ID')
    const resourceId = validId(req.body?.ressourcen_id, 'Ressourcen-ID')

    await transaction(async (connection) => {
        // Die Klassensperre serialisiert Änderungen ihrer Schultage.
        await requireClass(connection, classId)
        await requireResource(connection, resourceId)

        const existing = await connection.query(
            `SELECT klasse_id
       FROM klasse_ressource
       WHERE klasse_id = ? AND ressourcen_id = ?
       FOR UPDATE`,
            [classId, resourceId],
        )

        if (existing.length === 0) {
            await connection.query(
                `INSERT INTO klasse_ressource (klasse_id, ressourcen_id)
         VALUES (?, ?)`,
                [classId, resourceId],
            )
        }

        await updateSchoolDayCount(connection, classId)
    })

    res.json({
        klasse_id: classId,
        ressourcen_id: resourceId,
    })
}))

router.delete(
    '/klasse-ressourcen/:classId/:resourceId',
    route(async (req, res) => {
        const classId = validId(req.params.classId, 'Klassen-ID')
        const resourceId = validId(req.params.resourceId, 'Ressourcen-ID')

        await transaction(async (connection) => {
            await requireClass(connection, classId)
            await requireResource(connection, resourceId)

            await connection.query(
                `DELETE FROM klasse_ressource
         WHERE klasse_id = ? AND ressourcen_id = ?`,
                [classId, resourceId],
            )

            await updateSchoolDayCount(connection, classId)
        })

        res.json({ success: true })
    }),
)

// --------------------------------------------------
// Konfliktregeln
// --------------------------------------------------

router.get('/regeln', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT id, klasse_a_id, klasse_b_id
     FROM regel
     ORDER BY id`,
    )

    sendJson(res, rows)
}))

router.post('/regeln', route(async (req, res) => {
    const firstId = validId(req.body?.klasse_a_id, 'Erste Klassen-ID')
    const secondId = validId(req.body?.klasse_b_id, 'Zweite Klassen-ID')

    if (firstId === secondId) {
        fail(400, 'Eine Klasse kann keine Konfliktregel mit sich selbst haben.')
    }

    const classAId = Math.min(firstId, secondId)
    const classBId = Math.max(firstId, secondId)

    const created = await transaction(async (connection) => {
        // Einheitliche Sperrreihenfolge.
        await requireClass(connection, classAId)
        await requireClass(connection, classBId)

        // Erkennt auch bestehende Regeln mit umgekehrter Reihenfolge.
        const existing = await connection.query(
            `SELECT id
       FROM regel
       WHERE (klasse_a_id = ? AND klasse_b_id = ?)
          OR (klasse_a_id = ? AND klasse_b_id = ?)
       LIMIT 1
       FOR UPDATE`,
            [classAId, classBId, classBId, classAId],
        )

        if (existing.length > 0) {
            fail(409, 'Diese Konfliktregel existiert bereits.')
        }

        const result = await connection.query(
            `INSERT INTO regel (klasse_a_id, klasse_b_id)
       VALUES (?, ?)`,
            [classAId, classBId],
        )

        return {
            id: result.insertId,
            klasse_a_id: classAId,
            klasse_b_id: classBId,
        }
    })

    sendJson(res, created, 201)
}))

router.delete('/regeln/:id', route(async (req, res) => {
    const id = validId(req.params.id, 'Regel-ID')

    const result = await pool.query(
        'DELETE FROM regel WHERE id = ?',
        [id],
    )

    if (Number(result.affectedRows) === 0) {
        fail(404, 'Regel nicht gefunden.')
    }

    res.json({ success: true })
}))

export default router