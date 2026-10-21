const express = require('express')
const router = express.Router()
const db = require('../db')

// Alle Lehrgänge laden
router.get('/lehrgaenge', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, bezeichnung, semesteranzahl FROM lehrgang'
        )

        res.json(rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Lehrgänge konnten nicht geladen werden.'
        })
    }
})

module.exports = router