import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models';
import { config } from '../config';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }
    if (user.status !== 1) {
      return res.json({ code: 400, message: '账号已被禁用' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.json({
      code: 200,
      message: '登录成功',
      data: { token, user: { id: user.id, username: user.username, name: user.name, role: user.role } },
    });
  } catch (error) {
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const getUserInfo = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, role: true },
    });
    res.json({ code: 200, data: user });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};
