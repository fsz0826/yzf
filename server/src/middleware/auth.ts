import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest } from '../types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
};
