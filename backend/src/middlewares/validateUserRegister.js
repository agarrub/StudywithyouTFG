import { UserRegisterSchema } from '../schema/user-register.js';

export const validateUserRegister = (req, res, next) => {
  if (!req.body) return res.status(400).json({ message: 'Request body is missing' });
  const { name, lastName, email, password, confirmPassword, gender, birthDate, avatar } = req.body;

  try {
    if (!name || !lastName || !email || !password || !confirmPassword || !gender || !birthDate) {
      console.error('validateUserRegister: Missing fields', {
        name,
        lastName,
        email,
        password,
        confirmPassword,
        gender,
        birthDate,
      });
      return res.status(400).json({ message: 'Missing fields on register' });
    }

    const validate = UserRegisterSchema.safeParse({
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
        'validateUserRegister: Validation failed',
        JSON.stringify(validate.error.issues, null, 2),
      );
      return res.status(400).json({ message: 'Validation failed', errors: validate.error.issues });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
