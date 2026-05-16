import { Router } from 'express';
import { pool } from '../config/db.connection.js';
import { validateUserJWT } from '../middlewares/validateUserJWT.js';

export const pomodoroRouter = Router();

pomodoroRouter.post('/save', validateUserJWT, async (req, res) => {
  const { listID, seconds } = req.body;
  const userID = req.user.id;

  if (!listID || !seconds) {
    return res.status(400).json({ message: 'Campos vacíos.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO pomodoro (userID, seconds, session_date) VALUES (?,?, NOW())`,
      [userID, seconds],
    );

    if (!result.affectedRows) {
      return res.status(400).json({ message: 'La sesión no se pudo guardar.' });
    }

    res.status(201).json({ message: 'Sesión guardada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar la sesión de pomodoro.' });
  }
});
