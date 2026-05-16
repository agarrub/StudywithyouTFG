import { Router } from "express";
import { validateUserJWT } from "../middlewares/validateUserJWT.js";
import { pool } from "../config/db.connection.js";
export const notesRouter = Router();

notesRouter.post('/create', validateUserJWT, async (req, res) => {
    const { id, title, userID } = req.body;

    if (!id || !title || !userID) {
        return res.status(400).json({ message: 'Campos vacíos.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO notes (id, title, userID, created_at, last_modified) VALUES (?,?,?,NOW(),NOW())`,
            [id, title, userID]
        );

        if (!result.affectedRows) {
            return res.status(400).json({ message: 'La nota no se pudo crear.' });
        }

        const [notes] = await pool.query(`SELECT * FROM notes WHERE userID = ?`, [userID]);
        res.status(201).json({ message: 'Nota creada correctamente.', notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la nota.' });
    }
});

notesRouter.get('/', validateUserJWT, async (req, res) => {
    const userID = req.user.id;

    try {
        const [notes] = await pool.query(`SELECT * FROM notes WHERE userID = ?`, [userID]);
        res.status(200).json({ notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

notesRouter.put('/', validateUserJWT, async (req, res) => {
    const { id, title, content, userID } = req.body;

    if (!id || !title || content === undefined || content === null || !userID) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE notes SET title = ?, content = ?, last_modified = NOW() WHERE id = ? AND userID = ?`,
            [title, content, id, userID]
        );

        if (!result.affectedRows) {
            return res.status(400).json({ message: 'La nota no se pudo actualizar.' });
        }

        const [notes] = await pool.query(`SELECT * FROM notes WHERE userID = ?`, [userID]);
        res.status(200).json({ message: 'Nota actualizada correctamente.', notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

notesRouter.delete('/', validateUserJWT, async (req, res) => {
    const { id, userID } = req.body;

    if (!id || !userID) {
        return res.status(400).json({ message: 'Campos vacíos.' });
    }

    try {
        const [result] = await pool.query(
            `DELETE FROM notes WHERE id = ? AND userID = ?`,
            [id, userID]
        );

        if (!result.affectedRows) {
            return res.status(400).json({ message: 'La nota no se pudo eliminar.' });
        }

        const [notes] = await pool.query(`SELECT * FROM notes WHERE userID = ?`, [userID]);
        res.status(200).json({ message: 'Nota eliminada correctamente.', notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

notesRouter.patch('/rename', validateUserJWT, async (req, res) => {
    const { id, title, userID } = req.body;

    if (!id || !title || !userID) {
        return res.status(400).json({ message: 'Campos vacíos.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE notes SET title = ? WHERE id = ? AND userID = ?`,
            [title, id, userID]
        );

        if (!result.affectedRows) {
            return res.status(400).json({ message: 'La nota no se pudo renombrar.' });
        }

        res.status(200).json({ message: 'Nota renombrada correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






