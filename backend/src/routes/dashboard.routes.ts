import { Router } from 'express';
import { Role } from '@prisma/client';
import * as employeeController from '@/controllers/employee.controller';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize(Role.SUPER_ADMIN, Role.HR_MANAGER), employeeController.getDashboardStats);

export default router;
