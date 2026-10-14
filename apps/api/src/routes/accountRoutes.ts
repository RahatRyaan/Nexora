import { Router } from 'express';
import { getAccounts, getAccountById, createAccount } from '../controllers/accountController.js';

const router = Router();

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);

export default router;
