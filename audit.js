import { AsyncLocalStorage } from 'node:async_hooks'
import rawPool from './db.js'

const context = new AsyncLocalStorage()

function stringify(value) {
    return JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint'
            ? item.toString()
            : item,
    )
}

// Die vorhandenen Route-Helfer verwenden während einer
// protokollierten Änderung dieselbe äußere Transaktion.
function scopedConnection(connection) {
    return {
        query: (...args) =>
            connection.query(...args),

        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
    }
}

export const auditPool = {
    query: (...args) =>
        (
            context.getStore()?.connection ||
            rawPool
        ).query(...args),

    getConnection: async () => {
        const active = context.getStore()

        return active
            ? scopedConnection(active.connection)
            : rawPool.getConnection()
    },
}

function target(req, result = {}) {
    const path = req.route.path
    const params = req.params
    const body = req.body || {}

    const id =
        params.id ||
        result?.id ||
        null

    function simple(type, sql, values) {
        return { type, id, sql, values }
    }

    if (
        path === '/klassen' ||
        path === '/klassen/:id'
    ) {
        return simple(
            'Klasse',
            `SELECT id, bezeichnung, lehrgang_id,
                    notizen, anzahl_schultage_woche
             FROM klasse
             WHERE id = ?`,
            [id],
        )
    }

    if (
        path === '/lehrgaenge' ||
        path === '/lehrgaenge/:id'
    ) {
        return simple(
            'Lehrgang',
            `SELECT id, bezeichnung, semesteranzahl
             FROM lehrgang
             WHERE id = ?`,
            [id],
        )
    }

    if (
        path === '/ressourcen' ||
        path === '/ressourcen/:id'
    ) {
        return simple(
            'Räume',
            `SELECT id, wochentag, anzahl_raeume
             FROM ressourcen
             WHERE id = ?`,
            [id],
        )
    }

    if (
        path === '/regeln' ||
        path === '/regeln/:id'
    ) {
        return simple(
            'Konfliktregel',
            `SELECT r.id,
                    a.bezeichnung AS klasse_a,
                    b.bezeichnung AS klasse_b
             FROM regel r
             JOIN klasse a ON a.id = r.klasse_a_id
             JOIN klasse b ON b.id = r.klasse_b_id
             WHERE r.id = ?`,
            [id],
        )
    }

    if (path.startsWith('/klasse-ressourcen')) {
        const classId =
            params.classId ||
            body.klasse_id

        const resourceId =
            params.resourceId ||
            body.ressourcen_id

        return {
            type: 'Schultag',
            id: classId,
            sql:
                `SELECT k.bezeichnung AS klasse,
                        r.wochentag
                 FROM klasse_ressource kr
                 JOIN klasse k
                   ON k.id = kr.klasse_id
                 JOIN ressourcen r
                   ON r.id = kr.ressourcen_id
                 WHERE kr.klasse_id = ?
                   AND kr.ressourcen_id = ?`,
            values: [classId, resourceId],
        }
    }

    if (
        path ===
        '/klassen/:id/labels/:labelId/farbe'
    ) {
        return {
            type: 'Labelfarbe',
            id: params.labelId,
            sql:
                `SELECT id, name, farbe
                 FROM label
                 WHERE id = ?`,
            values: [params.labelId],
        }
    }

    if (
        path === '/klassen/:id/labels' ||
        path === '/klassen/:id/labels/:labelId'
    ) {
        return {
            type: 'Klassenzuordnung eines Labels',
            id: params.id,
            sql:
                `SELECT k.bezeichnung AS klasse,
                        l.name,
                        l.farbe
                 FROM klasse_label kl
                 JOIN klasse k
                   ON k.id = kl.klasse_id
                 JOIN label l
                   ON l.id = kl.label_id
                 WHERE kl.klasse_id = ?
                   AND (? IS NULL OR l.id = ?)
                   AND (? IS NULL OR l.name = ?)
                 ORDER BY l.id`,
            values: [
                params.id,
                params.labelId || null,
                params.labelId || null,
                body.name || null,
                body.name || null,
            ],
        }
    }

    if (
        path === '/lehrgaenge/:id/module' ||
        path.startsWith('/lehrgang-module/:id')
    ) {
        const fieldId =
            path === '/lehrgaenge/:id/module'
                ? result?.id || null
                : params.id

        const columns =
            'id, bezeichnung, lehrgang_id, ' +
            'lehrjahr, quartal, quartal_span, lektionen'

        return {
            type: path.endsWith('/name')
                ? 'Modulname'
                : 'Lektionenfeld',

            id: fieldId,

            sql: path.endsWith('/name')
                ? `SELECT ${columns}
                   FROM lehrgang_modul
                   WHERE (
                       lehrgang_id,
                       LOWER(TRIM(bezeichnung))
                   ) = (
                       SELECT lehrgang_id,
                              LOWER(TRIM(bezeichnung))
                       FROM lehrgang_modul
                       WHERE id = ?
                   )
                   ORDER BY id`
                : `SELECT ${columns}
                   FROM lehrgang_modul
                   WHERE id = ?`,

            values: [fieldId],
        }
    }

    throw new Error(
        'Für diese Änderung fehlt die Protokollierung: ' +
        path,
    )
}

export async function runAudited(
    req,
    res,
    handler,
) {
    if (
        ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    ) {
        return handler(req, res)
    }

    if (!req.user) {
        const error = new Error(
            'Bitte erneut anmelden.',
        )

        error.status = 401
        throw error
    }

    const connection =
        await rawPool.getConnection()

    let status = 200
    let contentType = null
    let payload
    let json = false
    let answered = false

    // Die Erfolgsantwort wird erst nach dem Commit gesendet.
    const buffered = {
        status(value) {
            status = value
            return this
        },

        type(value) {
            contentType = value
            return this
        },

        json(value) {
            payload = value
            json = true
            answered = true
            return this
        },

        send(value) {
            payload = value
            answered = true
            return this
        },
    }

    try {
        await connection.beginTransaction()

        await context.run(
            { connection },
            async () => {
                const beforeTarget = target(req)

                const before = await connection.query(
                    beforeTarget.sql + ' FOR UPDATE',
                    beforeTarget.values,
                )

                await handler(req, buffered)

                if (!answered || status >= 400) {
                    const error = new Error(
                        'Die Änderung wurde nicht gespeichert.',
                    )

                    error.status =
                        status >= 400 ? status : 500

                    throw error
                }

                const result = json
                    ? payload
                    : JSON.parse(payload)

                const afterTarget = target(
                    req,
                    result,
                )

                const after = await connection.query(
                    afterTarget.sql,
                    afterTarget.values,
                )

                // Erneutes Speichern unveränderter Werte
                // erzeugt keinen zusätzlichen Eintrag.
                if (
                    stringify(before) !==
                    stringify(after)
                ) {
                    const action = !before.length
                        ? 'hinzugefügt'
                        : !after.length
                            ? 'entfernt'
                            : 'geändert'

                    const row =
                        after[0] ||
                        before[0] ||
                        {}

                    const name =
                        row.bezeichnung ||
                        row.name ||
                        row.klasse ||
                        row.wochentag ||
                        ''

                    const description =
                        beforeTarget.type +
                        (
                            name
                                ? ' „' + name + '“'
                                : ''
                        ) +
                        ' ' +
                        action

                    await connection.query(
                        `INSERT INTO log (
                            user_id,
                            benutzername,
                            beschreibung,
                            erstellt_am,
                            aktion,
                            objekt_typ,
                            objekt_id,
                            vorher_json,
                            nachher_json
                         )
                         VALUES (
                            ?, ?, ?,
                            CURRENT_TIMESTAMP(),
                            ?, ?, ?, ?, ?
                         )`,
                        [
                            req.user.id,
                            req.user.username,
                            description,
                            action,
                            afterTarget.type,
                            afterTarget.id ||
                            beforeTarget.id,
                            stringify(before),
                            stringify(after),
                        ],
                    )
                }
            },
        )

        await connection.commit()
    } catch (error) {
        await connection.rollback().catch(() => {})
        throw error
    } finally {
        connection.release()
    }

    res.status(status)

    if (contentType) {
        res.type(contentType)
    }

    return json
        ? res.json(payload)
        : res.send(payload)
}