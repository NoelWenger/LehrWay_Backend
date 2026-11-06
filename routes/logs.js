import express from 'express'
import pool from '../db.js'

const router = express.Router()

const usernameSQL =
    "COALESCE(l.benutzername, u.username, 'Unbekannt')"

function parseRows(value) {
    try {
        const result = JSON.parse(value || '[]')
        return Array.isArray(result) ? result : []
    } catch {
        return []
    }
}

function textParameter(value, maximum, label) {
    if (value === undefined) return ''

    if (
        typeof value !== 'string' ||
        value.length > maximum
    ) {
        throw Object.assign(
            new Error(label + ' ist ungültig.'),
            { status: 400 },
        )
    }

    return value.trim()
}

function dateParameter(value, label) {
    const text = textParameter(value, 24, label)

    if (!text) return null

    const date = new Date(text)

    if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text) ||
        !Number.isFinite(date.getTime()) ||
        date.toISOString() !== text
    ) {
        throw Object.assign(
            new Error(label + ' ist ungültig.'),
            { status: 400 },
        )
    }

    return date.getTime() / 1000
}

// Benutzer aus dem gesamten Verlauf laden.
router.get('/logs/filter-options', async (_req, res) => {
    try {
        const rows = await pool.query(
            `SELECT DISTINCT
                 ${usernameSQL} AS username
             FROM log l
             LEFT JOIN user u ON u.id = l.user_id
             ORDER BY username`,
        )

        res.json({
            usernames: rows.map(row => row.username),
        })
    } catch (error) {
        console.error('Logfilter:', error)

        res.status(500).json({
            message:
                'Die Benutzerliste konnte nicht geladen werden.',
        })
    }
})

router.get('/logs', async (req, res) => {
    try {
        const before = textParameter(
            req.query.before,
            10,
            'Seitenmarkierung',
        )

        const search = textParameter(
            req.query.q,
            120,
            'Suchtext',
        )

        const username = textParameter(
            req.query.username,
            50,
            'Benutzer',
        )

        const action = textParameter(
            req.query.action,
            20,
            'Änderungsart',
        )

        const from = dateParameter(
            req.query.from,
            'Startdatum',
        )

        const until = dateParameter(
            req.query.until,
            'Enddatum',
        )

        if (
            before &&
            (
                !/^[1-9]\d*$/.test(before) ||
                Number(before) > 2147483647
            )
        ) {
            return res.status(400).json({
                message: 'Ungültige Seitenmarkierung.',
            })
        }

        if (
            action &&
            ![
                'hinzugefügt',
                'geändert',
                'entfernt',
            ].includes(action)
        ) {
            return res.status(400).json({
                message: 'Ungültige Änderungsart.',
            })
        }

        if (
            from !== null &&
            until !== null &&
            from >= until
        ) {
            return res.status(400).json({
                message:
                    'Das Enddatum darf nicht vor dem Startdatum liegen.',
            })
        }

        const conditions = []
        const values = []

        if (before) {
            conditions.push('l.id < ?')
            values.push(before)
        }

        if (username) {
            conditions.push(usernameSQL + ' = ?')
            values.push(username)
        }

        if (action) {
            conditions.push('l.aktion = ?')
            values.push(action)
        }

        if (search) {
            conditions.push(
                `(INSTR(
                    LOWER(COALESCE(l.beschreibung, '')),
                    LOWER(?)
                  ) > 0
                  OR INSTR(
                    LOWER(${usernameSQL}),
                    LOWER(?)
                  ) > 0)`,
            )

            values.push(search, search)
        }

        if (from !== null) {
            conditions.push(
                'UNIX_TIMESTAMP(l.erstellt_am) >= ?',
            )
            values.push(from)
        }

        if (until !== null) {
            conditions.push(
                'UNIX_TIMESTAMP(l.erstellt_am) < ?',
            )
            values.push(until)
        }

        const where = conditions.length
            ? 'WHERE ' + conditions.join(' AND ')
            : ''

        const rows = await pool.query(
            `SELECT
                 l.id,
                 ${usernameSQL} AS benutzername,
                 l.beschreibung,
                 UNIX_TIMESTAMP(
                     l.erstellt_am
                 ) AS created_seconds,
                 l.vorher_json,
                 l.nachher_json
             FROM log l
             LEFT JOIN user u ON u.id = l.user_id
             ${where}
             ORDER BY l.id DESC
             LIMIT 51`,
            values,
        )

        const page = rows.slice(0, 50)

        res.json({
            entries: page.map(row => ({
                id: String(row.id),
                username: row.benutzername,
                description: row.beschreibung,

                createdAt:
                    row.created_seconds == null
                        ? null
                        : new Date(
                            Number(row.created_seconds) * 1000,
                        ).toISOString(),

                before: parseRows(row.vorher_json),
                after: parseRows(row.nachher_json),
            })),

            nextCursor:
                rows.length > 50
                    ? String(page[page.length - 1].id)
                    : null,
        })
    } catch (error) {
        if (error.status === 400) {
            return res.status(400).json({
                message: error.message,
            })
        }

        console.error('Logs:', error)

        res.status(500).json({
            message:
                'Der Änderungsverlauf konnte nicht geladen werden.',
        })
    }
})

export default router