import { Router } from 'express';
import { Role } from '@prisma/client';
import * as orgController from '@/controllers/organization.controller';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/tree', authorize(Role.SUPER_ADMIN, Role.HR_MANAGER), orgController.getOrganizationTree);

export default router;
