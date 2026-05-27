import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../config/db.connection.js';
import { validateUserJWT } from '../middlewares/validateUserJWT.js';

export const todoListRouter = Router();

todoListRouter.get('/lists', validateUserJWT, async (req, res) => {
  const userID = req.user.id;

  try {
    const [result] = await pool.query(`SELECT * FROM todo_list WHERE userID = ?`, [userID]);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las listas.' });
  }
});

todoListRouter.post('/create', validateUserJWT, async (req, res) => {
  const title = req.body.title;
  const userID = req.user.id;

  if (!title || !userID) {
    return res.status(400).json({ message: 'Campos vacíos' });
  }

  try {
    const listID = crypto.randomUUID();


    const [result] = await pool.query(`INSERT INTO todo_list (id, userID, title, created_at, last_modified) VALUES (?,?,?, NOW(), NOW())`, [
      listID,
      userID,
      title,
    ]);

    if (!result.affectedRows) {
      return res.status(400).json({ message: 'La lista no se pudo crear.' });
    }

    res.status(201).json({ message: 'Lista creada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la lista.' });
  }
});

todoListRouter.put('/update', validateUserJWT, async (req, res) => {
  const title = req.body.title;
  const listID = req.body.listID;

  if (!title || !listID) {
    return res.status(400).json({ message: 'Campos vacíos.' });
  }

  try {
    const [result] = await pool.query(`UPDATE todo_list SET title = ?, last_modified = NOW() WHERE id = ?`, [
      title,
      listID,
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'La lista no se pudo actualizar.' });
    }

    res.status(200).json({ message: 'Lista actualizada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la lista.' });
  }
});

todoListRouter.get('/task/:listID', validateUserJWT, async (req, res) => {
  const { listID } = req.params;
  try {
    const [result] = await pool.query('SELECT id, task, is_done as done FROM todo_item WHERE list_id = ?', [listID]);
    const tasks = result.map(task => ({ ...task, done: Boolean(task.done), id: task.id.toString() }));
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las tareas.' });
  }
});

todoListRouter.post('/task/create', validateUserJWT, async (req, res) => {
  const { task, listID } = req.body;
  if (!task || !listID) return res.status(400).json({ message: 'Campos vacíos.' });
  try {
    const [result] = await pool.query('INSERT INTO todo_item (list_id, task, is_done) VALUES (?, ?, 0)', [listID, task]);
    if (!result.affectedRows) return res.status(400).json({ message: 'Error al crear la tarea.' });
    res.status(201).json({ message: result.insertId.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la tarea.' });
  }
});

todoListRouter.put('/task/update', validateUserJWT, async (req, res) => {
  const { task, listID } = req.body;
  if (!task || !task.id || !listID) return res.status(400).json({ message: 'Campos vacíos.' });
  try {
    const [result] = await pool.query('UPDATE todo_item SET task = ?, is_done = ? WHERE id = ? AND list_id = ?', [
      task.task,
      task.done ? 1 : 0,
      task.id,
      listID
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'La tarea no fue encontrada o no se pudo actualizar.' });
    res.status(200).json({ message: 'Tarea actualizada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la tarea.' });
  }
});

todoListRouter.delete('/task/delete', validateUserJWT, async (req, res) => {
  const { taskID, listID } = req.body;
  if (!taskID || !listID) return res.status(400).json({ message: 'Campos vacíos.' });
  try {
    const [result] = await pool.query('DELETE FROM todo_item WHERE id = ? AND list_id = ?', [taskID, listID]);
    if (!result.affectedRows) return res.status(404).json({ message: 'La tarea no se pudo eliminar.' });
    res.status(200).json({ message: 'Tarea eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la tarea.' });
  }
});
