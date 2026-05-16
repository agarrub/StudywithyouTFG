import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';

import { validateUserRegister } from '../middlewares/validateUserRegister.js';
import { validateUserLogin } from '../middlewares/validateUserLogin.js';
import { pool } from '../config/db.connection.js';
import { sendEmail } from '../services/emailSender.js';
import { comparePassword, hashPassword } from '../services/hashPassword.js';
import { sharpImages } from '../services/sharpImages.js';
import { validateUserJWT } from '../middlewares/validateUserJWT.js';
import { validateUserUpdate } from '../middlewares/validateUserUpdate.js';
import { Router } from 'express';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const authRouter = Router();

authRouter.post('/register', upload.single('avatar'), validateUserRegister, async (req, res) => {
  const { name, lastName, email, password, confirmPassword, gender, birthDate } = req.body;
  const avatar = req.file;

  if (!name || !lastName || !email || !password || !confirmPassword || !gender || !birthDate) {
    return res.status(400).json({ message: 'Campos vacíos en el registro' });
  }

  try {
    let [existUser] = await pool.query(`SELECT 1 FROM users WHERE email = ?`, [email]);

    if (existUser.length > 0) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    const userID = crypto.randomUUID();
    const token = crypto.randomUUID();
    const birthDateObj = birthDate;
    const request_time = new Date(Date.now());
    const expire_time = new Date(Date.now() + 3600000);
    const passwordHashed = await hashPassword(password);

    let fileName = '';

    if (avatar) {
      try {
        fileName = await sharpImages(avatar);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    await pool.query(
      `INSERT INTO users (id, name, last_name, gender, email, password, birthdate, avatar) VALUES (?,?,?,?,?,?,?,?)`,
      [userID, name, lastName, gender, email, passwordHashed, birthDateObj, fileName],
    );
    await pool.query(
      `INSERT INTO actions (userID, token, request_time, expire_time, action, is_used) VALUES (?,?,?,?,?,?)`,
      [userID, token, request_time, expire_time, 'create_account', false],
    );

    const createLink = `http://localhost:3000/auth/confirm_email/${token}`;

    await sendEmail(email, 'Registro de correo', {
      templateName: 'createAccount',
      link: createLink,
      user: name
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente, por favor revisa tu correo' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.get('/confirm_email/:token', async (req, res) => {
  const token = req.params.token;

  try {
    const [actions] = await pool.query(`SELECT * FROM actions WHERE token = ?`, [token]);

    if (actions.length === 0) {
      return res.status(404).json({ message: 'Token inválido o no encontrado' });
    }

    const action = actions[0];

    if (action.is_used) {
      return res.status(400).json({ message: 'Usuario ya activo o token ya usado' });
    }

    if (action.expire_time < Date.now()) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    const [users] = await pool.query(`SELECT * FROM users WHERE id = ?`, [action.userID]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const user = users[0];

    const execution_time = new Date(Date.now());

    const [activatedUser] = await pool.query(
      `UPDATE actions SET is_used = TRUE, execution_time = ? WHERE userID = ? AND token = ?`,
      [execution_time, user.id, token],
    );

    if (!activatedUser.affectedRows) {
      return res.status(400).json({ message: 'Usuario no activado' });
    }

    res.status(200).json({ message: 'Usuario activado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.post('/login', validateUserLogin, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Campos vacíos en el login' });
  }

  try {
    const [users] = await pool.query(`SELECT * FROM users WHERE email = ?`, [email]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    const user = users[0];

    const isSamePw = await comparePassword(password, user.password);

    if (!isSamePw) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: '12h',
    });

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.status(200).json({ message: 'Usuario logueado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.get('/user', validateUserJWT, async (req, res) => {
  const userID = req.user.id;

  try {
    const [users] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userID]);

    if (users.length !== 0) {
      const user = users[0];
      if (user.avatar) {
        user.avatar = `http://localhost:3000/profileUploads/${user.avatar}`;
      } else {
        user.avatar = '/HeaderImg/user.png';
      }
      const userResponse = {
        id: user.id,
        name: user.name,
        lastName: user.last_name,
        email: user.email,
        gender: user.gender,
        birthDate:
          user.birthdate instanceof Date
            ? `${user.birthdate.getFullYear()}-${String(user.birthdate.getMonth() + 1).padStart(2, '0')}-${String(user.birthdate.getDate()).padStart(2, '0')}`
            : String(user.birthdate ?? '').substring(0, 10),
        avatar: user.avatar,
      };
      res.status(200).json({ message: 'Usuario encontrado', user: userResponse });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

authRouter.post('/logout', async (_req, res) => {
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
  res.status(200).json({ message: 'Usuario deslogueado correctamente' });
});

authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Correo electrónico requerido' });

  try {
    const [users] = await pool.query(`SELECT * FROM users WHERE email = ?`, [email]);
    if (users.length === 0) {
      return res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de restablecimiento' });
    }
    const user = users[0];

    const token = crypto.randomUUID();
    const request_time = new Date(Date.now());
    const expire_time = new Date(Date.now() + 3600000);
    const action = 'reset_password';

    await pool.query(
      `INSERT INTO actions (userID, token, request_time, expire_time, action, is_used) VALUES (?,?,?,?,?,?)`,
      [user.id, token, request_time, expire_time, action, false],
    );

    const createLink = `http://localhost:4200/reset-form?token=${token}`;
    await sendEmail(user.email, 'Reinicia tu contraseña', {
      templateName: 'passwordReset',
      link: createLink,
      user: user.name
    });

    res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de restablecimiento' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.post('/reset-password/:token', async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'La contraseña es requerida' });
  }

  try {
    const [actions] = await pool.query(
      `SELECT * FROM actions WHERE token = ? AND action = 'reset_password'`,
      [token],
    );

    if (actions.length === 0) {
      return res.status(404).json({ message: 'Token inválido o no encontrado' });
    }

    const action = actions[0];

    if (action.is_used) {
      return res.status(400).json({ message: 'Token ya utilizado' });
    }

    if (action.expire_time < Date.now()) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    const passwordHashed = await hashPassword(password);

    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [passwordHashed, action.userID]);

    const execution_time = new Date(Date.now());
    await pool.query(
      `UPDATE actions SET is_used = TRUE, execution_time = ? WHERE userID = ? AND token = ?`,
      [execution_time, action.userID, token],
    );

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.put(
  '/update',
  validateUserJWT,
  upload.single('avatar'),
  validateUserUpdate,
  async (req, res) => {
    const userID = req.user.id;
    const { name, lastName, email, password, gender, birthDate } = req.body;
    const avatar = req.file;

    try {
      const [users] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userID]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const currentUser = users[0];

      if (email !== currentUser.email) {
        const [emailExists] = await pool.query(`SELECT 1 FROM users WHERE email = ? AND id != ?`, [
          email,
          userID,
        ]);
        if (emailExists.length > 0) {
          return res.status(400).json({ message: 'El correo ya está registrado por otro usuario' });
        }
      }

      const birthDateObj = birthDate;

      let passwordHashed = currentUser.password;
      if (password && password.trim() !== '') {
        passwordHashed = await hashPassword(password);
      }

      let fileName = currentUser.avatar;
      if (avatar) {
        try {
          fileName = await sharpImages(avatar);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error al subir el avatar' });
        }
      }

      await pool.query(
        `UPDATE users SET name = ?, last_name = ?, gender = ?, email = ?, password = ?, birthdate = ?, avatar = ? WHERE id = ?`,
        [name, lastName, gender, email, passwordHashed, birthDateObj, fileName, userID],
      );

      res.status(200).json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
);
