import { createHash, randomBytes } from 'node:crypto'
import pool from './db.js'

const cookieName = 'lehrway_session'
const maxAge = 8 * 60 * 60 * 1000

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
}

function hash(token) {
    return createHash('sha256')
        .update(token)
        .digest('hex')
}

function readToken(req) {
    const value = (req.headers.cookie || '')
        .split(';')
        .map(part => part.trim())
        .find(part =>
            part.startsWith(cookieName + '='),
        )
        ?.slice(cookieName.length + 1)

    return /^[a-f0-9]{64}$/.test(value || '')
        ? value
        : null
}

export function requireAppHeader(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    if (req.get('X-Lehrway-Request') !== '1') {
        return res.status(403).json({
            message: 'Die Anfrage wurde nicht akzeptiert.',
        })
    }

    next()
}

export async function createSession(
    connection,
    req,
    res,
    userId,
) {
    const previous = readToken(req)

    if (previous) {
        await connection.query(
            'DELETE FROM app_session WHERE token_hash = ?',
            [hash(previous)],
        )
    }

    const token = randomBytes(32).toString('hex')

    await connection.query(
        `INSERT INTO app_session
         (token_hash, user_id, expires_at)
         VALUES (
             ?,
             ?,
             DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR)
         )`,
        [hash(token), userId],
    )

    res.cookie(cookieName, token, {
        ...cookieOptions,
        maxAge,
    })
}

export async function requireSession(req, res, next) {
    const token = readToken(req)

    if (!token) {
        return res.status(401).json({
            message: 'Bitte erneut anmelden.',
        })
    }

    try {
        const rows = await pool.query(
            `SELECT u.id, u.username, u.email
             FROM app_session s
             INNER JOIN user u ON u.id = s.user_id
             WHERE s.token_hash = ?
               AND s.expires_at > UTC_TIMESTAMP()`,
            [hash(token)],
        )

        if (rows.length === 0) {
            res.clearCookie(
                cookieName,
                cookieOptions,
            )

            return res.status(401).json({
                message:
                    'Deine Sitzung ist abgelaufen. ' +
                    'Bitte erneut anmelden.',
            })
        }

        req.user = {
            id: Number(rows[0].id),
            username: rows[0].username,
            email: rows[0].email,
        }

        next()
    } catch (error) {
        console.error('Sitzungsprüfung:', error)

        res.status(500).json({
            message:
                'Die Anmeldung konnte nicht geprüft werden.',
        })
    }
}

export async function endSession(req, res) {
    const token = readToken(req)

    if (token) {
        await pool.query(
            'DELETE FROM app_session WHERE token_hash = ?',
            [hash(token)],
        )
    }

    res.clearCookie(
        cookieName,
        cookieOptions,
    )
}