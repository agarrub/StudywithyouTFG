import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from 'dotenv';
import { authRouter } from './routes/auth-routes.js';
import { eventRouter } from './routes/event-routes.js';
import cookieParser from 'cookie-parser';
import { notesRouter } from './routes/notes-routes.js';
import { pomodoroRouter } from './routes/pomodoro-routes.js';
import { todoListRouter } from './routes/todolist-routes.js';

config({ path: path.join(import.meta.dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/profileUploads', express.static(path.join(import.meta.dirname, '../profileUploads')));

app.use('/auth', authRouter);
app.use('/event', eventRouter);
app.use('/notes', notesRouter);
app.use('/pomodoro', pomodoroRouter);
app.use('/todolist', todoListRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
