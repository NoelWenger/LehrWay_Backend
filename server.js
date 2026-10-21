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

        // 1. Prüfen, ob die E-Mail schon existiert
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
        if (Connection) Connection.release(); // Leitung immer zurück in den Pool!
    }
});

// Routen für Lehrgang und Homepage oder so
const homepageRoutes = require('./routes/homepage')
const lehrgangRoutes = require('./routes/lehrgang')

app.use('/api', homepageRoutes)
app.use('/api', lehrgangRoutes)


app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});