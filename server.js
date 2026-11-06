import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'

import pool, {
    testConnection,
} from './db.js'

import {
    createSession,
    endSession,
    requireSession,
    requireAppHeader,
} from './auth.js'

import homepageRoutes from './routes/homepage.js'
import lehrgangRoutes from './routes/lehrgang.js'
import logsRoutes from './routes/logs.js'

const app = express()
const PORT = Number(process.env.PORT || 3000)

const origins = (
    process.env.FRONTEND_ORIGINS ||
    'http://localhost:5173'
)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

app.use(cors({
    origin(origin, callback) {
        callback(
            null,
            !origin || origins.includes(origin),
        )
    },
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'X-Lehrway-Request',
    ],
}))

app.use(express.json({
    limit: '100kb',
}))

app.use('/api', requireAppHeader)

app.get('/api/version', (_req, res) => {
    res.json({
        version: 'sessions-und-logs-v1',
    })
})

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body || {}

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password ||
        !email.includes('@')
    ) {
        return res.status(400).json({
            success: false,
            message:
                'Bitte E-Mail und Passwort ausfüllen.',
        })
    }

    if (
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).json({
            success: false,
            message: 'Das Passwort ist zu lang.',
        })
    }

    try {
        const address = email.trim()
        const username = address.split('@')[0]

        if (
            address.length > 100 ||
            username.length > 50 ||
            !username
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Die E-Mail-Adresse ist ungültig oder zu lang.',
            })
        }

        const existing = await pool.query(
            `SELECT id
             FROM user
             WHERE email = ? OR username = ?
             LIMIT 1`,
            [address, username],
        )

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'E-Mail oder Benutzername ist bereits vergeben.',
            })
        }

        const passwordHash = await bcrypt.hash(
            password,
            10,
        )

        await pool.query(
            `INSERT INTO user (
                username,
                email,
                passwort_hash,
                zuletzt_aktiv
             )
             VALUES (
                ?, ?, ?,
                CURRENT_TIMESTAMP()
             )`,
            [
                username,
                address,
                passwordHash,
            ],
        )

        res.json({
            success: true,
            message:
                'Registrierung erfolgreich!',
        })
    } catch (error) {
        console.error(
            'Registrierung:',
            error,
        )

        const duplicate =
            error.code === 'ER_DUP_ENTRY'

        res.status(
            duplicate ? 409 : 500,
        ).json({
            success: false,
            message: duplicate
                ? 'E-Mail oder Benutzername ist bereits vergeben.'
                : 'Registrierung fehlgeschlagen.',
        })
    }
})

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body || {}

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message:
                'Bitte alle Felder ausfüllen.',
        })
    }

    let connection

    try {
        connection =
            await pool.getConnection()

        const users = await connection.query(
            'SELECT * FROM user WHERE email = ?',
            [email.trim()],
        )

        const user = users[0]

        if (
            !user ||
            !await bcrypt.compare(
                password,
                user.passwort_hash,
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    'E-Mail oder Passwort ist falsch.',
            })
        }

        await connection.query(
            `UPDATE user
             SET zuletzt_aktiv =
                 CURRENT_TIMESTAMP()
             WHERE id = ?`,
            [user.id],
        )

        await createSession(
            connection,
            req,
            res,
            user.id,
        )

        res.json({
            success: true,
            user: {
                id: Number(user.id),
                username: user.username,
                email: user.email,
            },
        })
    } catch (error) {
        console.error('Login:', error)

        res.status(500).json({
            success: false,
            message:
                'Anmeldung fehlgeschlagen.',
        })
    } finally {
        connection?.release()
    }
})

app.post('/api/logout', async (req, res) => {
    try {
        await endSession(req, res)

        res.json({
            success: true,
        })
    } catch (error) {
        console.error('Logout:', error)

        res.status(500).json({
            message:
                'Abmelden fehlgeschlagen. Bitte erneut versuchen.',
        })
    }
})

// Alle nachfolgenden API-Routen benötigen
// eine gültige Anmeldung.
app.use('/api', requireSession)

app.get('/api/me', (req, res) => {
    res.json({
        user: req.user,
    })
})

app.use('/api', homepageRoutes)
app.use('/api', lehrgangRoutes)
app.use('/api', logsRoutes)

app.use('/api', (_req, res) => {
    res.status(404).json({
        message:
            'API-Endpunkt nicht gefunden.',
    })
})

await testConnection()

app.listen(PORT, () => {
    console.log(
        'Server läuft auf Port ' + PORT,
    )
})