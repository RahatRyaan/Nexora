import { Router } from 'express';
import {
  getApprovals,
  getApprovalById,
  approveAction,
  rejectAction,
  editAction,
  rollbackAction,
} from '../controllers/approvalController.js';

const router = Router();

router.get('/', getApprovals);
router.get('/:id', getApprovalById);
router.post('/:id/approve', approveAction);
router.post('/:id/reject', rejectAction);
router.post('/:id/edit', editAction);
router.post('/:id/rollback', rollbackAction);

export default router;
