import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getPhones,
  getPhoneDetail,
  createPhone,
  updatePhone,
  deletePhone,
} from '../controllers/phone';

const router = Router();

router.use(authMiddleware);

router.get('/', getPhones);
router.get('/:id', getPhoneDetail);
router.post('/', createPhone);
router.put('/:id', updatePhone);
router.delete('/:id', deletePhone);

export default router;
