import { Router } from 'express';
import { matchThreeWayInvoice, getFinancialAnomalies, attemptAutonomousPayment } from '../controllers/financeController.js';

const router = Router();

router.post('/invoices/match', matchThreeWayInvoice);
router.get('/anomalies', getFinancialAnomalies);
router.post('/payments/execute-autonomous', attemptAutonomousPayment);

export default router;
