import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
