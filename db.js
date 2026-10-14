import mariadb from 'mariadb';
import 'dotenv/config';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

export async function testConnection() {
    let Connection;
    try {
        Connection = await pool.getConnection();
        console.log("Erfolgreich mit MariaDB verbunden!");
    } catch (err) {
        console.error("Fehler bei der MariaDB-Verbindung:", err.message);
    } finally {
        if (Connection) Connection.release();
    }
}

export default pool;