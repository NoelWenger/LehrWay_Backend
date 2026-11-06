import express from 'express'
import pool from '../db.js'

const router = express.Router()

function parseRows(value) {
    try {
        return JSON.parse(value || '[]')
    } catch {
        return []
    }
}

router.get('/logs', async (req, res) => {
    const before = req.query.before

    if (
        before !== undefined &&
        !/^[1-9][0-9]*$/.test(String(before))
    ) {
        return res.status(400).json({
            message: 'Ungültige Seitenmarkierung.',
        })
    }

    try {
        const rows = await pool.query(
            `SELECT
                 l.id,
                 COALESCE(
                     l.benutzername,
                     u.username,
                     'Unbekannt'
                 ) AS benutzername,
                 l.beschreibung,
                 UNIX_TIMESTAMP(
                     l.erstellt_am
                 ) AS created_seconds,
                 l.objekt_typ,
                 l.vorher_json,
                 l.nachher_json
             FROM log l
             LEFT JOIN user u
               ON u.id = l.user_id
             WHERE (? IS NULL OR l.id < ?)
             ORDER BY l.id DESC
             LIMIT 51`,
            [
                before || null,
                before || null,
            ],
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
                            Number(
                                row.created_seconds,
                            ) * 1000,
                        ).toISOString(),
                before: parseRows(
                    row.vorher_json,
                ),
                after: parseRows(
                    row.nachher_json,
                ),
            })),

            nextCursor:
                rows.length > 50
                    ? String(
                        page[page.length - 1].id,
                    )
                    : null,
        })
    } catch (error) {
        console.error('Logs:', error)

        res.status(500).json({
            message:
                'Der Änderungsverlauf konnte nicht geladen werden.',
        })
    }
})

export default router