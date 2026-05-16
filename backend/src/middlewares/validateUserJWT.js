import jwt from 'jsonwebtoken';

export const validateUserJWT = (req, res, next) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decodedUser = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

    req.user = decodedUser;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
