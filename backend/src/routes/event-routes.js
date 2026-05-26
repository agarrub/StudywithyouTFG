import { Router } from 'express';
import { validateEvent } from '../middlewares/validateEvent.js';
import { validateUserJWT } from '../middlewares/validateUserJWT.js';
import { pool } from '../config/db.connection.js';
import cron from 'node-cron';
import { sendEmail } from '../services/emailSender.js';

export const eventRouter = Router();

eventRouter.post('/create-event', validateUserJWT, validateEvent, async (req, res) => {
  const { title, startDate, endDate, startTime, endTime, allDay } = req.body;

  const userID = req.user.id;

  try {
    if (!title || !startDate || !userID) {
      return res.status(400).json({ message: 'El título y la fecha de inicio son requeridos' });
    }
    if (!allDay && (!endDate || !startTime || !endTime)) {
      return res.status(400).json({ message: 'Todos los campos de tiempo son requeridos para eventos que no son todo el día' });
    }

    const startDatetime = allDay ? `${startDate} 00:00:00` : `${startDate} ${startTime}:00`;
    const actualEndDate = endDate || startDate;
    const endDatetime = allDay ? `${actualEndDate} 23:59:59` : `${actualEndDate} ${endTime}:00`;

    const [eventCreated] = await pool.query(
      'INSERT INTO events (title, start_datetime, end_datetime, allDay, userID) VALUES (?, ?, ?, ?, ?)',
      [title, startDatetime, endDatetime, allDay, userID],
    );

    if (!eventCreated.affectedRows) {
      return res.status(400).json({ message: 'El evento no se pudo crear.' });
    }

    await pool.query('INSERT INTO events_notifications (eventID) VALUES (?)', [
      eventCreated.insertId,
    ]);

    res.status(201).json({ message: 'Evento creado correctamente.' });
  } catch (error) {
    console.error(
      'Error creating event:',
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      userID,
    );
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

eventRouter.get('/get-events', validateUserJWT, async (req, res) => {
  const userID = req.user.id;

  try {
    await pool.query('DELETE FROM events WHERE userID = ? AND end_datetime < NOW()', [userID]);

    const [events] = await pool.query('SELECT * FROM events WHERE userID = ?', [userID]);

    if (!events) {
      return res.status(404).json({ message: 'No se encontraron eventos.' });
    }

    if (events.length === 0) {
      return res.status(404).json({ message: 'No se encontraron eventos.' });
    }

    const formatLocalDatetime = (d) => {
      if (!d) return null;
      if (!(d instanceof Date)) return String(d).substring(0, 19).replace('T', ' ');
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${mo}-${day}T${h}:${min}:${s}`;
    };

    const formattedEvents = events.map((e) => ({
      ...e,
      start_datetime: formatLocalDatetime(e.start_datetime),
      end_datetime: formatLocalDatetime(e.end_datetime),
    }));

    res.status(200).json({ message: 'Eventos encontrados', events: formattedEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

eventRouter.delete('/delete-event', validateUserJWT, async (req, res) => {
  const { eventID } = req.body;

  const userID = req.user.id;

  try {
    if (!eventID || !userID) {
      return res.status(400).json({ message: 'Campos vacíos.' });
    }

    await pool.query('DELETE FROM events_notifications WHERE eventID = ?', [eventID]);

    const [eventDeleted] = await pool.query('DELETE FROM events WHERE id = ? AND userID = ?', [
      eventID,
      userID,
    ]);

    if (!eventDeleted.affectedRows) {
      return res.status(400).json({ message: 'El evento no se pudo eliminar.' });
    }
    res.status(200).json({ message: 'Evento eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

eventRouter.put('/update-event', validateUserJWT, validateEvent, async (req, res) => {
  const { eventID, title, startDate, endDate, startTime, endTime, allDay } = req.body;

  const userID = req.user.id;
  const isAllDay = allDay === true || allDay === 1;

  try {
    if (!eventID || !title || !startDate || !userID) {
      return res.status(400).json({ message: 'Campos vacíos.' });
    }
    if (!isAllDay && (!endDate || !startTime || !endTime)) {
      return res.status(400).json({ message: 'Todos los campos de tiempo son requeridos para eventos que no son todo el día' });
    }

    const startDatetime = isAllDay ? `${startDate} 00:00:00` : `${startDate} ${startTime}:00`;
    const actualEndDate = endDate || startDate;
    const endDatetime = isAllDay ? `${actualEndDate} 23:59:59` : `${actualEndDate} ${endTime}:00`;

    const [eventUpdated] = await pool.query(
      'UPDATE events SET title = ?, start_datetime = ?, end_datetime = ?, allDay = ?, userID = ? WHERE id = ?',
      [title, startDatetime, endDatetime, isAllDay, userID, eventID],
    );

    if (!eventUpdated.affectedRows) {
      return res.status(400).json({ message: 'El evento no se pudo actualizar.' });
    }

    res.status(200).json({ message: 'Evento actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


cron.schedule('* * * * *', async () => {
  try {
    console.log('Cron funcionando a las:', new Date().toLocaleString());
    const [events] = await pool.query(
      'SELECT * FROM events WHERE DATE(end_datetime) <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)',
    );

    for (const event of events) {
      const [notNotified] = await pool.query(
        'SELECT * FROM events_notifications WHERE eventID = ? AND is_notified = 0',
        [event.id],
      );

      if (notNotified.length === 0) {
        continue;
      }
      await pool.query('UPDATE events_notifications SET is_notified = 1 WHERE eventID = ?', [
        event.id,
      ]);
      const [user] = await pool.query('SELECT email, name FROM users WHERE id = ?', [event.userID]);
      
      const endDate = new Date(event.end_datetime);
      const today = new Date();
      const diffTime = endDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      await sendEmail(
        user[0].email,
        'Recordatorio de eventos',
        {
          templateName: 'eventReminder',
          eventName: event.title,
          eventDate: endDate.toISOString().split('T')[0],
          eventTime: endDate.toTimeString().split(' ')[0].substring(0, 5),
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          user: user[0].name
        }
      );
      console.log(`Email sent to ${user[0].email}`);
    }
  } catch (error) {
    console.error(error);
  }
});
