import express from 'express'
import {
    auditPool as pool,
    runAudited,
} from '../audit.js'

const router = express.Router()

const weekdays = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
]

// --------------------------------------------------
// Hilfsfunktionen
// --------------------------------------------------

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

function validLabelColor(value) {
    if (
        typeof value !== 'string' ||
        !/^#[0-9a-fA-F]{6}$/.test(value)
    ) {
        fail(400, 'Bitte eine gültige Farbe auswählen.')
    }

    return value.toLowerCase()
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

async function requireClass(connection, id) {
    const rows = await connection.query(
        'SELECT id, schuljahr_id FROM klasse WHERE id = ? FOR UPDATE',
        [id],
    )

    if (rows.length === 0) {
        fail(404, 'Klasse nicht gefunden.')
    }

    return rows[0]
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

async function checkDuplicateClass(connection, name, schoolYearId, excludedId = 0) {
    const rows = await connection.query(
        `SELECT id
     FROM klasse
     WHERE LOWER(TRIM(bezeichnung)) = LOWER(?)
       AND schuljahr_id = ?
       AND id <> ?
     LIMIT 1`,
        [name, schoolYearId, excludedId],
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
// Schuljahr & Kopierlogik
// --------------------------------------------------

function parseYearParam(req) {
    const raw = req.query?.year ?? req.body?.year ?? 2026
    const year = Number(raw)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        fail(400, 'Ungültiges Schuljahr angegeben.')
    }
    return year
}

async function copyYearData(connection, sourceYearId, targetYearId) {
    // 1. Ressourcen kopieren
    const oldResources = await connection.query(
        'SELECT id, wochentag, anzahl_raeume FROM ressourcen WHERE schuljahr_id = ?',
        [sourceYearId]
    )
    const resourceMap = new Map()
    for (const r of oldResources) {
        const ins = await connection.query(
            'INSERT INTO ressourcen (wochentag, anzahl_raeume, schuljahr_id) VALUES (?, ?, ?)',
            [r.wochentag, r.anzahl_raeume, targetYearId]
        )
        resourceMap.set(r.id, ins.insertId)
    }

    // 2. Klassen kopieren
    const oldClasses = await connection.query(
        'SELECT id, bezeichnung, lehrgang_id, notizen, anzahl_schultage_woche FROM klasse WHERE schuljahr_id = ?',
        [sourceYearId]
    )
    const classMap = new Map()
    for (const c of oldClasses) {
        const ins = await connection.query(
            'INSERT IGNORE INTO klasse (bezeichnung, lehrgang_id, notizen, anzahl_schultage_woche, schuljahr_id) VALUES (?, ?, ?, ?, ?)',
            [c.bezeichnung, c.lehrgang_id, c.notizen, c.anzahl_schultage_woche, targetYearId]
        )
        const newClassId = ins.insertId || (await connection.query(
            'SELECT id FROM klasse WHERE bezeichnung = ? AND schuljahr_id = ?',
            [c.bezeichnung, targetYearId]
        ))[0]?.id

        if (newClassId) {
            classMap.set(c.id, newClassId)

            await connection.query(
                `INSERT INTO klasse_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
                 SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, ?
                 FROM klasse_modul WHERE klasse_id = ?`,
                [newClassId, c.id]
            )

            await connection.query(
                `INSERT IGNORE INTO klasse_label (klasse_id, label_id, farbe)
                 SELECT ?, label_id, farbe
                 FROM klasse_label WHERE klasse_id = ?`,
                [newClassId, c.id]
            )
        }
    }

    // 3. Schultage (klasse_ressource) kopieren
    for (const [oldClassId, newClassId] of classMap.entries()) {
        const oldAssignments = await connection.query(
            'SELECT ressourcen_id FROM klasse_ressource WHERE klasse_id = ?',
            [oldClassId]
        )
        for (const a of oldAssignments) {
            const newResId = resourceMap.get(a.ressourcen_id)
            if (newResId) {
                await connection.query(
                    'INSERT IGNORE INTO klasse_ressource (klasse_id, ressourcen_id) VALUES (?, ?)',
                    [newClassId, newResId]
                )
            }
        }
    }

    // 4. Regeln kopieren
    const oldRules = await connection.query(
        `SELECT r.klasse_a_id, r.klasse_b_id 
         FROM regel r
         INNER JOIN klasse k ON k.id = r.klasse_a_id
         WHERE k.schuljahr_id = ?`,
        [sourceYearId]
    )
    for (const r of oldRules) {
        const newA = classMap.get(r.klasse_a_id)
        const newB = classMap.get(r.klasse_b_id)
        if (newA && newB) {
            const idA = Number(newA)
            const idB = Number(newB)
            await connection.query(
                'INSERT IGNORE INTO regel (klasse_a_id, klasse_b_id) VALUES (?, ?)',
                [Math.min(idA, idB), Math.max(idA, idB)]
            )
        }
    }
}

async function getOrCreateSchoolYear(connection, startJahr) {
    let existing = await connection.query(
        'SELECT id, start_jahr, bezeichnung FROM schuljahr WHERE start_jahr = ?',
        [startJahr]
    )

    if (existing.length > 0) {
        return existing[0]
    }

    const nextShort = String(startJahr + 1).slice(-2)
    const bezeichnung = `${startJahr}/${nextShort}`

    await connection.query(
        'INSERT IGNORE INTO schuljahr (start_jahr, bezeichnung) VALUES (?, ?)',
        [startJahr, bezeichnung]
    )

    existing = await connection.query(
        'SELECT id, start_jahr, bezeichnung FROM schuljahr WHERE start_jahr = ?',
        [startJahr]
    )
    const newYearId = existing[0].id

    const existingClasses = await connection.query(
        'SELECT id FROM klasse WHERE schuljahr_id = ? LIMIT 1',
        [newYearId]
    )

    if (existingClasses.length === 0) {
        const prevYearRows = await connection.query(
            'SELECT id FROM schuljahr WHERE start_jahr = ?',
            [startJahr - 1]
        )

        if (prevYearRows.length > 0) {
            const prevYearId = prevYearRows[0].id
            await copyYearData(connection, prevYearId, newYearId)
        } else {
            for (const tag of weekdays) {
                await connection.query(
                    'INSERT IGNORE INTO ressourcen (wochentag, anzahl_raeume, schuljahr_id) VALUES (?, 5, ?)',
                    [tag, newYearId]
                )
            }
        }
    }

    return { id: newYearId, start_jahr: startJahr, bezeichnung }
}

// --------------------------------------------------
// Klassen
// --------------------------------------------------

router.get('/klassen', route(async (req, res) => {
    const startYear = parseYearParam(req)
    const rows = await transaction(async connection => {
        const year = await getOrCreateSchoolYear(connection, startYear)
        return connection.query(
            `SELECT id, bezeichnung, lehrgang_id, schuljahr_id
             FROM klasse
             WHERE schuljahr_id = ?
             ORDER BY bezeichnung`,
            [year.id]
        )
    })
    sendJson(res, rows)
}))

router.post('/klassen', route(async (req, res) => {
    const name = validClassName(req.body?.bezeichnung)
    const courseId = validId(req.body?.lehrgang_id, 'Lehrgang-ID')
    const startYear = parseYearParam(req)

    const created = await transaction(async connection => {
        const year = await getOrCreateSchoolYear(connection, startYear)

        const courses = await connection.query(
            'SELECT id FROM lehrgang WHERE id = ? LOCK IN SHARE MODE',
            [courseId],
        )

        if (courses.length === 0) {
            fail(404, 'Der ausgewählte Lehrgang existiert nicht mehr.')
        }

        await checkDuplicateClass(connection, name, year.id)

        const result = await connection.query(
            `INSERT INTO klasse
             (bezeichnung, lehrgang_id, notizen, anzahl_schultage_woche, schuljahr_id)
             VALUES (?, ?, NULL, 0, ?)`,
            [name, courseId, year.id],
        )

        const classId = result.insertId

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

    await transaction(async connection => {
        const current = await requireClass(connection, id)
        await checkDuplicateClass(connection, name, current.schuljahr_id, id)

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

    await transaction(async connection => {
        await requireClass(connection, id)

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

router.get('/ressourcen', route(async (req, res) => {
    const startYear = parseYearParam(req)
    const rows = await transaction(async connection => {
        const year = await getOrCreateSchoolYear(connection, startYear)
        return connection.query(
            `SELECT id, wochentag, anzahl_raeume, schuljahr_id
             FROM ressourcen
             WHERE schuljahr_id = ?
             ORDER BY id`,
            [year.id]
        )
    })
    sendJson(res, rows)
}))

router.post('/ressourcen', route(async (req, res) => {
    const day = req.body?.wochentag
    const capacity = validCapacity(req.body?.anzahl_raeume)

    if (!weekdays.includes(day)) {
        fail(400, 'Ungültiger Wochentag.')
    }

    const created = await transaction(async connection => {
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

    await transaction(async connection => {
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
// --------------------------------------------------

router.get('/klasse-ressourcen', route(async (req, res) => {
    const startYear = parseYearParam(req)
    const rows = await transaction(async connection => {
        const year = await getOrCreateSchoolYear(connection, startYear)
        return connection.query(
            `SELECT DISTINCT kr.klasse_id, kr.ressourcen_id
             FROM klasse_ressource kr
             INNER JOIN klasse k ON k.id = kr.klasse_id
             WHERE k.schuljahr_id = ?
             ORDER BY kr.klasse_id, kr.ressourcen_id`,
            [year.id]
        )
    })
    sendJson(res, rows)
}))

router.post('/klasse-ressourcen', route(async (req, res) => {
    const classId = validId(req.body?.klasse_id, 'Klassen-ID')
    const resourceId = validId(req.body?.ressourcen_id, 'Ressourcen-ID')

    await transaction(async connection => {
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

        await transaction(async connection => {
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

router.get('/regeln', route(async (req, res) => {
    const startYear = parseYearParam(req)
    const rows = await transaction(async connection => {
        const year = await getOrCreateSchoolYear(connection, startYear)
        return connection.query(
            `SELECT r.id, r.klasse_a_id, r.klasse_b_id
             FROM regel r
             INNER JOIN klasse k ON k.id = r.klasse_a_id
             WHERE k.schuljahr_id = ?
             ORDER BY r.id`,
            [year.id]
        )
    })
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

    const created = await transaction(async connection => {
        await requireClass(connection, classAId)
        await requireClass(connection, classBId)

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

// --------------------------------------------------
// Labels mit gemeinsamer Farbe
// --------------------------------------------------

router.get('/klasse-labels', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT DISTINCT
       kl.klasse_id,
       l.id AS label_id,
       l.name,
       l.farbe
     FROM klasse_label kl
     INNER JOIN label l ON l.id = kl.label_id
     ORDER BY l.name`,
    )

    sendJson(res, rows)
}))

router.post('/klassen/:id/labels', route(async (req, res) => {
    const classId = validId(req.params.id, 'Klassen-ID')

    const name = typeof req.body?.name === 'string'
        ? req.body.name.trim()
        : ''

    const color = validLabelColor(
        req.body?.farbe ?? '#0d6efd',
    )

    if (!name || Array.from(name).length > 50) {
        fail(400, 'Bitte ein Label mit 1 bis 50 Zeichen eingeben.')
    }

    const assignment = await transaction(async connection => {
        await requireClass(connection, classId)

        // Vorhandene Labels behalten ihre gemeinsame Farbe.
        await connection.query(
            `INSERT INTO label (name, farbe)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
            [name, color],
        )

        const labels = await connection.query(
            `SELECT id, name, farbe
       FROM label
       WHERE name = ?
       FOR UPDATE`,
            [name],
        )

        const label = labels[0]

        if (!label) {
            fail(500, 'Das Label konnte nicht geladen werden.')
        }

        const existing = await connection.query(
            `SELECT klasse_id
       FROM klasse_label
       WHERE klasse_id = ? AND label_id = ?
       FOR UPDATE`,
            [classId, label.id],
        )

        if (existing.length === 0) {
            await connection.query(
                `INSERT INTO klasse_label (klasse_id, label_id)
         VALUES (?, ?)`,
                [classId, label.id],
            )
        }

        return {
            klasse_id: classId,
            label_id: label.id,
            name: label.name,
            farbe: label.farbe,
        }
    })

    sendJson(res, assignment)
}))

router.patch(
    '/klassen/:id/labels/:labelId/farbe',
    route(async (req, res) => {
        const classId = validId(req.params.id, 'Klassen-ID')
        const labelId = validId(req.params.labelId, 'Label-ID')
        const color = validLabelColor(req.body?.farbe)

        await transaction(async connection => {
            await requireClass(connection, classId)

            const labels = await connection.query(
                'SELECT id FROM label WHERE id = ? FOR UPDATE',
                [labelId],
            )

            if (labels.length === 0) {
                fail(404, 'Label nicht gefunden.')
            }

            const assignments = await connection.query(
                `SELECT klasse_id
         FROM klasse_label
         WHERE klasse_id = ? AND label_id = ?
         FOR UPDATE`,
                [classId, labelId],
            )

            if (assignments.length === 0) {
                fail(404, 'Dieses Label ist der Klasse nicht zugeordnet.')
            }

            // Die Farbe gilt für sämtliche Klassen mit diesem Label.
            await connection.query(
                'UPDATE label SET farbe = ? WHERE id = ?',
                [color, labelId],
            )
        })

        res.json({
            label_id: labelId,
            farbe: color,
        })
    }),
)

router.delete(
    '/klassen/:id/labels/:labelId',
    route(async (req, res) => {
        const classId = validId(req.params.id, 'Klassen-ID')
        const labelId = validId(req.params.labelId, 'Label-ID')

        await transaction(async connection => {
            await requireClass(connection, classId)

            // Nur die Zuordnung entfernen, nicht das gemeinsame Label.
            await connection.query(
                `DELETE FROM klasse_label
         WHERE klasse_id = ? AND label_id = ?`,
                [classId, labelId],
            )
        })

        res.json({ success: true })
    }),
)

// Alle vorhandenen Labels für die Wiederverwendung laden.
router.get('/labels', route(async (_req, res) => {
    const rows = await pool.query(
        `SELECT id, name, farbe
     FROM label
     ORDER BY name`,
    )

    sendJson(res, rows)
}))

export default router