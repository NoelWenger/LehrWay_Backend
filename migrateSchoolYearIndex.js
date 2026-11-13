import pool from './db.js'

export async function migrateSchoolYearIndex() {
    const indexes = await pool.query(`
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

    if (indexes.length === 0) return

    await pool.query(`
        ALTER TABLE klasse
            DROP INDEX bezeichnung,
            ADD UNIQUE KEY uq_klasse_bezeichnung_schuljahr
                (bezeichnung, schuljahr_id)
    `)
}