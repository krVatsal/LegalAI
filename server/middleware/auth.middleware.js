import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

export const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (!token) {
    // Also check cookies for token (for withCredentials)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
  }
  if (!token) {
    return res.status(403).json({ message: 'No token provided!' });
  }  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), authConfig.jwtSecret);
    req.user = { 
      _id: decoded.id,
      id: decoded.id  // Add consistent id property for compatibility
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized!' });
  }
};