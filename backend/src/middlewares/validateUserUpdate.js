import { UserUpdateSchema } from '../schema/user-update.js';

export const validateUserUpdate = (req, res, next) => {
  if (!req.body) return res.status(400).json({ message: 'Request body is missing' });
  const { name, lastName, email, password, confirmPassword, gender, birthDate, avatar } = req.body;

  try {
    if (!name || !lastName || !email || !gender || !birthDate) {
      console.error('validateUserUpdate: Missing fields', {
        name,
        lastName,
        email,
        gender,
        birthDate,
      });
      return res.status(400).json({ message: 'Missing required fields on update' });
    }

    const validate = UserUpdateSchema.safeParse({
      name,
      lastName,
      email,
      password,
      confirmPassword,
      gender,
      birthDate,
      avatar,
    });

    if (!validate.success) {
      console.error(
        'validateUserUpdate: Validation failed',
        JSON.stringify(validate.error.issues, null, 2),
      );
      return res.status(400).json({ message: 'Validation failed', errors: validate.error.issues });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
