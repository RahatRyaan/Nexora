import { Router } from 'express';
import { enrichLeadAndGenerateOutreach, getDeals } from '../controllers/salesController.js';

const router = Router();

router.post('/outreach/generate', enrichLeadAndGenerateOutreach);
router.get('/deals', getDeals);

export default router;
