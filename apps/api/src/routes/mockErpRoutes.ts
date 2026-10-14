import { Router } from 'express';
import {
  getMockPartners,
  getMockInvoices,
  getMockTickets,
  getMockOrders,
  getMockWriteLog,
  resetMockErp,
} from '../controllers/mockErpController.js';

const router = Router();

router.get('/partners', getMockPartners);
router.get('/invoices', getMockInvoices);
router.get('/tickets', getMockTickets);
router.get('/orders', getMockOrders);
router.get('/writes', getMockWriteLog);
router.post('/reset', resetMockErp);

export default router;
