import { Router } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import * as employeeController from '@/controllers/employee.controller';
import * as orgController from '@/controllers/organization.controller';
import { authenticate } from '@/middleware/auth';
import { authorize, authorizeSelfOrRoles } from '@/middleware/rbac';
import { validate } from '@/middleware/validate';
import { isPrivilegedRole } from '@/utils/roles';
import { ApiError } from '@/utils/ApiError';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateOwnProfileSchema,
  listEmployeesQuerySchema,
  assignManagerSchema,
} from '@/validators/employee.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only PNG, JPEG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
  },
});

router.use(authenticate);

router.get(
  '/',
  authorize(Role.SUPER_ADMIN, Role.HR_MANAGER),
  validate(listEmployeesQuerySchema),
  employeeController.listEmployees,
);

router.post(
  '/import',
  authorize(Role.SUPER_ADMIN, Role.HR_MANAGER),
  upload.single('file'),
  employeeController.importCsv,
);

router.get('/:id', authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER), employeeController.getEmployee);

router.post(
  '/',
  authorize(Role.SUPER_ADMIN, Role.HR_MANAGER),
  validate(createEmployeeSchema),
  employeeController.createEmployee,
);

// Self-edits use a narrower schema (see updateEmployee controller for the branch logic).
router.put(
  '/:id',
  authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => {
    const isSelf = req.params.id === req.user!.sub;
    const schema = isSelf && !isPrivilegedRole(req.user!.role) ? updateOwnProfileSchema : updateEmployeeSchema;
    return validate(schema)(req, res, next);
  },
  employeeController.updateEmployee,
);

router.delete('/:id', authorize(Role.SUPER_ADMIN), employeeController.deleteEmployee);

// Self or Super Admin / HR Manager can update a profile photo — same
// self-or-privileged rule as viewing/editing the profile itself.
router.post(
  '/:id/photo',
  authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER),
  uploadPhoto.single('photo'),
  employeeController.uploadPhoto,
);

router.get(
  '/:id/reportees',
  authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER),
  orgController.getReportees,
);

router.patch(
  '/:id/manager',
  authorize(Role.SUPER_ADMIN),
  validate(assignManagerSchema),
  orgController.assignManager,
);

export default router;
