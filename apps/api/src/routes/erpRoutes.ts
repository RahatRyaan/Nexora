import { Router } from 'express';
import {
  getErpStatus,
  triggerSync,
  testConnection,
  updateFieldMappings,
  testWriteBackDryRun,
} from '../controllers/erpController.js';

const router = Router();

router.get('/status', getErpStatus);
router.post('/sync', triggerSync);
router.post('/test-connection', testConnection);
router.put('/field-mappings', updateFieldMappings);
router.post('/write-back/dry-run', testWriteBackDryRun);

export default router;
