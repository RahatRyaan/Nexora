import { Router } from 'express';
import { getOrganizations, getOrganizationBySlug } from '../controllers/organizationController.js';

const router = Router();

router.get('/', getOrganizations);
router.get('/:slug', getOrganizationBySlug);

export default router;
