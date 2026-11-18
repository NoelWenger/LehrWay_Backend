import pool from './db.js'

export async function migrateSchoolYearIndex() {
    const connection = await pool.getConnection()

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schuljahr (
                id INT AUTO_INCREMENT PRIMARY KEY,
                start_jahr INT NOT NULL UNIQUE,
                bezeichnung VARCHAR(20) NOT NULL
            )
        `)

        await connection.query(`
            INSERT INTO schuljahr (start_jahr, bezeichnung)
            VALUES (2026, '2026/27')
            ON DUPLICATE KEY UPDATE start_jahr = VALUES(start_jahr)
        `)

        const [baseYear] = await connection.query(`
            SELECT id
            FROM schuljahr
            WHERE start_jahr = 2026
        `)

        await connection.query(`
            ALTER TABLE klasse
            ADD COLUMN IF NOT EXISTS schuljahr_id INT NULL
        `)

        await connection.query(`
            ALTER TABLE ressourcen
            ADD COLUMN IF NOT EXISTS schuljahr_id INT NULL
        `)

        await connection.query(
            `UPDATE klasse
             SET schuljahr_id = ?
             WHERE schuljahr_id IS NULL`,
            [baseYear.id],
        )

        await connection.query(
            `UPDATE ressourcen
             SET schuljahr_id = ?
             WHERE schuljahr_id IS NULL`,
            [baseYear.id],
        )

        await connection.query(`
            ALTER TABLE klasse
            MODIFY COLUMN schuljahr_id INT NOT NULL
        `)

        await connection.query(`
            ALTER TABLE ressourcen
            MODIFY COLUMN schuljahr_id INT NOT NULL
        `)

        await connection.query(`
            ALTER TABLE klasse
            ADD UNIQUE INDEX IF NOT EXISTS
                uq_klasse_bezeichnung_schuljahr
                (bezeichnung, schuljahr_id)
        `)

        const oldIndexes = await connection.query(`
            SELECT INDEX_NAME AS index_name
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'klasse'
              AND INDEX_NAME = 'bezeichnung'
              AND NON_UNIQUE = 0
            GROUP BY INDEX_NAME
            HAVING COUNT(*) = 1
               AND MAX(COLUMN_NAME) = 'bezeichnung'
        `)

        if (oldIndexes.length > 0) {
            await connection.query(`
                ALTER TABLE klasse
                DROP INDEX bezeichnung
            `)
        }

        console.log('Schuljahr-Migration erfolgreich abgeschlossen.')
    } finally {
        connection.release()
    }
}