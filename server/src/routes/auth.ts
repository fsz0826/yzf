import { Router } from 'express';
import { login, getUserInfo } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/userinfo', authMiddleware, getUserInfo);

export default router;
