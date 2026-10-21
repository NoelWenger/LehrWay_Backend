const express = require('express')
const router = express.Router()
const db = require('../db')

// Klassen aus MariaDB laden
router.get('/klassen', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, bezeichnung, lehrgang_id FROM klasse'
        )

        res.json(rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Klassen konnten nicht geladen werden.'
        })
    }
})

module.exports = router