import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './authRoutes.js';
import statsRouter from './statsRoutes.js';
import organizationRouter from './organizationRoutes.js';
import accountRouter from './accountRoutes.js';
import ticketRouter from './ticketRoutes.js';
import invoiceRouter from './invoiceRoutes.js';
import mockErpRouter from './mockErpRoutes.js';
import erpRouter from './erpRoutes.js';
import approvalRouter from './approvalRoutes.js';
import auditLogRouter from './auditLogRoutes.js';
import salesRouter from './salesRoutes.js';
import financeRouter from './financeRoutes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/stats', statsRouter);
router.use('/organizations', organizationRouter);
router.use('/accounts', accountRouter);
router.use('/tickets', ticketRouter);
router.use('/invoices', invoiceRouter);
router.use('/mock-erp', mockErpRouter);
router.use('/erp', erpRouter);
router.use('/approvals', approvalRouter);
router.use('/audit-logs', auditLogRouter);
router.use('/sales', salesRouter);
router.use('/finance', financeRouter);

export default router;
