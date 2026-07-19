import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/config/db';
import { ApiError } from '@/utils/ApiError';
import { hashPassword } from '@/utils/password';
import { PaginatedResult } from '@/types';
import { wouldCreateCycle } from './organization.service';

export const PUBLIC_SELECT = {
  id: true,
  employeeCode: true,
  name: true,
  email: true,
  phone: true,
  department: true,
  designation: true,
  salary: true,
  joiningDate: true,
  status: true,
  role: true,
  managerId: true,
  // Manager relation limited to id/name/employeeCode — never exposes salary/email/etc.
  manager: {
    select: {
      id: true,
      name: true,
      employeeCode: true,
    },
  },
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeSelect;

async function generateEmployeeCode(): Promise<string> {
  const count = await prisma.employee.count();
  const next = count + 1;
  return `EMP-${String(next).padStart(4, '0')}`;
}

async function findActiveEmployee(id: string) {
  return prisma.employee.findFirst({ where: { id, isDeleted: false } });
}

export async function requireActiveEmployee(id: string, notFoundMessage = 'Employee not found') {
  const employee = await findActiveEmployee(id);
  if (!employee) throw ApiError.notFound(notFoundMessage);
  return employee;
}

interface ListParams {
  search?: string;
  department?: string;
  role?: Role;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: 'joiningDate' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function listEmployees(params: ListParams): Promise<PaginatedResult<unknown>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const where: Prisma.EmployeeWhereInput = {
    isDeleted: false,
    ...(params.department ? { department: params.department } : {}),
    ...(params.role ? { role: params.role } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.EmployeeOrderByWithRelationInput = params.sortBy
    ? { [params.sortBy]: params.sortOrder ?? 'asc' }
    : { createdAt: 'desc' };

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: PUBLIC_SELECT,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    select: PUBLIC_SELECT,
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
}

interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  joiningDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE';
  role?: Role;
  managerId?: string | null;
  profileImageUrl?: string;
}

/** Only a Super Admin may assign SUPER_ADMIN; HR may only create EMPLOYEE-role records. */
export async function createEmployee(input: CreateEmployeeInput, creatorRole: Role) {
  if (input.role === Role.SUPER_ADMIN && creatorRole !== Role.SUPER_ADMIN) {
    throw ApiError.forbidden('Only a Super Admin can assign the Super Admin role');
  }
  if (creatorRole === Role.HR_MANAGER && input.role && input.role !== Role.EMPLOYEE) {
    throw ApiError.forbidden('HR Manager can only create employees with the Employee role');
  }

  if (input.managerId) {
    const manager = await findActiveEmployee(input.managerId);
    if (!manager) throw ApiError.badRequest('Assigned manager does not exist');
  }

  const employeeCode = await generateEmployeeCode();
  const hashed = await hashPassword(input.password);

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name: input.name,
      email: input.email,
      password: hashed,
      phone: input.phone,
      department: input.department,
      designation: input.designation,
      salary: input.salary,
      joiningDate: input.joiningDate,
      status: input.status ?? 'ACTIVE',
      role: input.role ?? Role.EMPLOYEE,
      managerId: input.managerId ?? null,
      profileImageUrl: input.profileImageUrl,
    },
    select: PUBLIC_SELECT,
  });

  return employee;
}

interface UpdateEmployeeInput
  extends Partial<Omit<CreateEmployeeInput, 'phone' | 'department' | 'designation' | 'salary' | 'joiningDate' | 'profileImageUrl'>> {
  // Explicit null clears the field; omitted (undefined) leaves it unchanged
  // — Prisma treats an `undefined` value in `data` as a no-op for that key.
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  salary?: number | null;
  joiningDate?: Date | null;
  profileImageUrl?: string | null;
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
  updaterRole: Role,
) {
  const existing = await requireActiveEmployee(id);

  const isRoleChanging = input.role !== undefined && input.role !== existing.role;
  if (isRoleChanging) {
    if (input.role === Role.SUPER_ADMIN && updaterRole !== Role.SUPER_ADMIN) {
      throw ApiError.forbidden('Only a Super Admin can assign the Super Admin role');
    }
    if (updaterRole === Role.HR_MANAGER && input.role !== Role.EMPLOYEE) {
      throw ApiError.forbidden('HR Manager can only assign the Employee role');
    }
  }
  if (existing.role === Role.SUPER_ADMIN && updaterRole !== Role.SUPER_ADMIN) {
    throw ApiError.forbidden('Only a Super Admin can modify another Super Admin');
  }

  if (input.managerId) {
    if (input.managerId === id) {
      throw ApiError.badRequest('An employee cannot report to themselves');
    }
    const manager = await findActiveEmployee(input.managerId);
    if (!manager) throw ApiError.badRequest('Assigned manager does not exist');

    const cycle = await wouldCreateCycle(id, input.managerId);
    if (cycle) {
      throw ApiError.badRequest('This assignment would create a circular reporting relationship');
    }
  }

  const data: Prisma.EmployeeUpdateInput = { ...input };
  if (input.password) {
    data.password = await hashPassword(input.password);
  }

  const updated = await prisma.employee.update({
    where: { id },
    data,
    select: PUBLIC_SELECT,
  });

  return updated;
}

interface OwnProfileInput {
  phone?: string | null;
  profileImageUrl?: string | null;
  password?: string;
}

/** Self-service update: only phone, profile image, and password may be changed this way. */
export async function updateOwnProfile(id: string, input: OwnProfileInput) {
  await requireActiveEmployee(id);

  const data: Prisma.EmployeeUpdateInput = {
    phone: input.phone,
    profileImageUrl: input.profileImageUrl,
  };
  if (input.password) {
    data.password = await hashPassword(input.password);
  }

  return prisma.employee.update({ where: { id }, data, select: PUBLIC_SELECT });
}

/** Soft delete: marks the employee inactive/deleted instead of removing the row. */
export async function softDeleteEmployee(id: string) {
  const existing = await requireActiveEmployee(id);
  if (existing.role === Role.SUPER_ADMIN) {
    throw ApiError.forbidden('Super Admin accounts cannot be deleted');
  }

  // Re-parent direct reports to the deleted employee's manager to keep
  // the org tree intact rather than orphaning them.
  await prisma.$transaction([
    prisma.employee.updateMany({
      where: { managerId: id },
      data: { managerId: existing.managerId },
    }),
    prisma.employee.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: 'INACTIVE' },
    }),
  ]);
}

export async function getDashboardStats() {
  const [total, active, inactive, departments] = await Promise.all([
    prisma.employee.count({ where: { isDeleted: false } }),
    prisma.employee.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
    prisma.employee.count({ where: { isDeleted: false, status: 'INACTIVE' } }),
    prisma.employee.findMany({
      where: { isDeleted: false, department: { not: null } },
      distinct: ['department'],
      select: { department: true },
    }),
  ]);

  return {
    totalEmployees: total,
    activeEmployees: active,
    inactiveEmployees: inactive,
    departmentCount: departments.length,
  };
}
