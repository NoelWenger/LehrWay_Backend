
import express from 'express'
import pool from '../db.js'

const router = express.Router()

function sendError(res, error) {
    console.error('Lehrgang-API:', error)
    res.status(500).json({
        message: 'Ein Datenbankfehler ist aufgetreten.'
    })
}

function validId(value) {
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
}

// Alle Lehrgänge laden
router.get('/lehrgaenge', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT id, bezeichnung, semesteranzahl FROM lehrgang ORDER BY bezeichnung'
        )

        res.json(rows)
    } catch (error) {
        sendError(res, error)
    }
})

// Lehrgang erstellen
router.post('/lehrgaenge', async (req, res) => {
    const bezeichnung = String(req.body.bezeichnung ?? '').trim()
    const semesteranzahl = Number(req.body.semesteranzahl)

    if (!bezeichnung || ![2, 4, 6].includes(semesteranzahl)) {
        return res.status(400).json({
            message: 'Ungültiger Lehrgangsname oder Semesteranzahl.'
        })
    }

    try {
        const result = await pool.query(
            'INSERT INTO lehrgang (bezeichnung, semesteranzahl) VALUES (?, ?)',
            [bezeichnung, semesteranzahl]
        )

        res.status(201).json({
            id: Number(result.insertId),
            bezeichnung,
            semesteranzahl
        })
    } catch (error) {
        sendError(res, error)
    }
})

// Lehrgang umbenennen
router.put('/lehrgaenge/:id', async (req, res) => {
    const id = validId(req.params.id)
    const bezeichnung = String(req.body.bezeichnung ?? '').trim()

    if (!id || !bezeichnung) {
        return res.status(400).json({
            message: 'Ungültige Angaben.'
        })
    }

    try {
        const result = await pool.query(
            'UPDATE lehrgang SET bezeichnung = ? WHERE id = ?',
            [bezeichnung, id]
        )

        if (Number(result.affectedRows) === 0) {
            return res.status(404).json({
                message: 'Lehrgang nicht gefunden.'
            })
        }

        res.json({ id, bezeichnung })
    } catch (error) {
        sendError(res, error)
    }
})

// Lehrgang löschen
router.delete('/lehrgaenge/:id', async (req, res) => {
    const id = validId(req.params.id)

    if (!id) {
        return res.status(400).json({
            message: 'Ungültige Lehrgang-ID.'
        })
    }

    try {
        const result = await pool.query(
            'DELETE FROM lehrgang WHERE id = ?',
            [id]
        )

        if (Number(result.affectedRows) === 0) {
            return res.status(404).json({
                message: 'Lehrgang nicht gefunden.'
            })
        }

        res.status(204).send()
    } catch (error) {
        sendError(res, error)
    }
})

// Module eines Lehrgangs laden
router.get('/lehrgaenge/:id/module', async (req, res) => {
    const id = validId(req.params.id)

    if (!id) {
        return res.status(400).json({
            message: 'Ungültige Lehrgang-ID.'
        })
    }

    try {
        const rows = await pool.query(
            `SELECT id, bezeichnung, lehrjahr, semester,
              quartal, quartal_span, lektionen, lehrgang_id
       FROM lehrgang_modul
       WHERE lehrgang_id = ?
       ORDER BY bezeichnung, lehrjahr, quartal`,
            [id]
        )

        res.json(rows)
    } catch (error) {
        sendError(res, error)
    }
})

// Modul beziehungsweise Quartalsfeld erstellen
router.post('/lehrgaenge/:id/module', async (req, res) => {
    const lehrgangId = validId(req.params.id)
    const bezeichnung = String(req.body.bezeichnung ?? '').trim()

    const lehrjahr = Number(req.body.lehrjahr)
    const semester = Number(req.body.semester)
    const quartal = Number(req.body.quartal)
    const quartalSpan = Number(req.body.quartal_span ?? 1)
    const lektionen = Number(req.body.lektionen ?? 0)

    const startQuarter = (lehrjahr - 1) * 4 + quartal

    if (
        !lehrgangId ||
        !bezeichnung ||
        !Number.isInteger(lehrjahr) ||
        lehrjahr < 1 ||
        lehrjahr > 3 ||
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 6 ||
        !Number.isInteger(quartal) ||
        quartal < 1 ||
        quartal > 4 ||
        !Number.isInteger(quartalSpan) ||
        quartalSpan < 1 ||
        startQuarter + quartalSpan - 1 > 12 ||
        !Number.isInteger(lektionen) ||
        lektionen < 0
    ) {
        return res.status(400).json({
            message: 'Ungültige Modul- oder Quartalsangaben.'
        })
    }

    try {
        const result = await pool.query(
            `INSERT INTO lehrgang_modul
       (bezeichnung, lehrjahr, semester, quartal,
        quartal_span, lektionen, lehrgang_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                bezeichnung,
                lehrjahr,
                semester,
                quartal,
                quartalSpan,
                lektionen,
                lehrgangId
            ]
        )

        res.status(201).json({
            id: Number(result.insertId),
            bezeichnung,
            lehrjahr,
            semester,
            quartal,
            quartal_span: quartalSpan,
            lektionen,
            lehrgang_id: lehrgangId
        })
    } catch (error) {
        sendError(res, error)
    }
})

// Lektionen eines Feldes bearbeiten
router.put('/lehrgang-module/:id', async (req, res) => {
    const id = validId(req.params.id)
    const lektionen = Number(req.body.lektionen)

    if (!id || !Number.isInteger(lektionen) || lektionen < 0) {
        return res.status(400).json({
            message: 'Ungültige Lektionszahl.'
        })
    }

    try {
        const result = await pool.query(
            'UPDATE lehrgang_modul SET lektionen = ? WHERE id = ?',
            [lektionen, id]
        )

        if (Number(result.affectedRows) === 0) {
            return res.status(404).json({
                message: 'Quartalsfeld nicht gefunden.'
            })
        }

        res.json({ id, lektionen })
    } catch (error) {
        sendError(res, error)
    }
})

// Quartalsfeld löschen
router.delete('/lehrgang-module/:id', async (req, res) => {
    const id = validId(req.params.id)

    if (!id) {
        return res.status(400).json({
            message: 'Ungültige Feld-ID.'
        })
    }

    try {
        const result = await pool.query(
            'DELETE FROM lehrgang_modul WHERE id = ?',
            [id]
        )

        if (Number(result.affectedRows) === 0) {
            return res.status(404).json({
                message: 'Quartalsfeld nicht gefunden.'
            })
        }

        res.status(204).send()
    } catch (error) {
        sendError(res, error)
    }
})

export default router
