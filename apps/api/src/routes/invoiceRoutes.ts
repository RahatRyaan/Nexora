import { Router } from 'express';
import { getInvoices, getInvoiceById } from '../controllers/invoiceController.js';

const router = Router();

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

export default router;
