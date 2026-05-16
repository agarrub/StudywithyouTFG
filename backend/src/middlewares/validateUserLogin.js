import { UserLoginSchema } from '../schema/user-login.js';

export const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields on validate login' });
  }

  const validate = UserLoginSchema.safeParse({ email, password });

  if (!validate.success) {
    return res.status(400).json({ message: 'Validation failed', errors: validate.error.issues });
  }

  next();
};
