import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool, { testConnection } from './db.js';

const app = express();
const PORT = 3000;

testConnection();

app.use(cors());
app.use(express.json());

app.post('/api/register', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Bitte alle Felder ausfüllen!" });
    }

    let Connection;
    try {
        Connection = await pool.getConnection();

        const existingUsers = await Connection.query("SELECT * FROM user WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: "Diese E-Mail ist bereits registriert!" });
        }

        const saltRounds = 10;
        const passwortHash = await bcrypt.hash(password, saltRounds);
        const username = email.split('@')[0];

        await Connection.query(
            "INSERT INTO user (username, email, passwort_hash, zuletzt_aktiv) VALUES (?, ?, ?, NOW())",
            [username, email, passwortHash]
        );

        console.log(`Benutzer erfolgreich in MariaDB gespeichert: ${email}`);
        res.json({ success: true, message: "Registrierung erfolgreich!" });

    } catch (err) {
        console.error("Fehler bei der Registrierung:", err);
        res.status(500).json({ success: false, message: "Server-Fehler bei der Registrierung!" });
    } finally {
        if (Connection) Connection.release();
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Bitte alle Felder ausfüllen!" });
    }

    let Connection;
    try {
        Connection = await pool.getConnection();

        const users = await Connection.query("SELECT * FROM user WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Benutzer nicht gefunden!" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.passwort_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Falsches Passwort!" });
        }

        await Connection.query("UPDATE user SET zuletzt_aktiv = NOW() WHERE id = ?", [user.id]);

        console.log(`Erfolgreicher Login für: ${email}`);
        res.json({
            success: true,
            message: "Login erfolgreich!",
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error("Fehler beim Login:", err);
        res.status(500).json({ success: false, message: "Server-Fehler beim Login!" });
    } finally {
        if (Connection) Connection.release();
    }
});

import homepageRoutes from './routes/homepage.js'
import lehrgangRoutes from './routes/lehrgang.js'

app.use('/api', homepageRoutes)
app.use('/api', lehrgangRoutes)


app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});