import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;
const TEST_USER = {
    email: "test@lehrway.com",
    password: "FCS"
};

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    console.log("Login-Versuch mit:", email, password);

    if (email === TEST_USER.email && password === TEST_USER.password)
    {
        res.json({
            success: true,
            message: "Login erfolgreich!",
            user: { email: email }
        });
    }
    else
    {
        res.status(401).json({
            success: false,
            message: "Falsche E-Mail oder falsches Passwort!"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});