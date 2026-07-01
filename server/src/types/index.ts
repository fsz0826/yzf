import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: number; username: string; role: string };
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
