import { Role } from '@prisma/client';

/** Super Admin and HR Manager can access the employee directory, dashboard, and org chart. */
export function isPrivilegedRole(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.HR_MANAGER;
}
