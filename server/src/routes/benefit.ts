import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getBenefits,
  getBenefitDetail,
  createBenefit,
  updateBenefit,
  deleteBenefit,
} from '../controllers/benefit';

const router = Router();

router.use(authMiddleware);

router.get('/', getBenefits);
router.get('/:id', getBenefitDetail);
router.post('/', createBenefit);
router.put('/:id', updateBenefit);
router.delete('/:id', deleteBenefit);

export default router;
