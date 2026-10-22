import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clinical_sanctuary_dev_secret_mits_2026_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (userId, role = 'USER') => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
