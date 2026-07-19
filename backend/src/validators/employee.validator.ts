import { z } from 'zod';
import { Role, EmployeeStatus } from '@prisma/client';

const phoneRegex = /^\+?[0-9]{7,15}$/;

// Accepts a full external URL (manual entry) or a relative /uploads/... path
// (what the profile-photo upload endpoint stores) — never both.
const profileImageUrlSchema = z
  .string()
  .refine(
    (value) => /^https?:\/\//.test(value) || value.startsWith('/uploads/'),
    'Must be a valid URL or an uploaded photo path',
  );

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
    department: z.string().max(100).optional(),
    designation: z.string().max(100).optional(),
    salary: z.number().nonnegative('Salary must be a positive number').optional(),
    joiningDate: z.coerce.date().optional(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    role: z.nativeEnum(Role).optional(),
    managerId: z.string().uuid().nullable().optional(),
    profileImageUrl: profileImageUrlSchema.optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      // Nullable DB columns accept explicit null to mean "clear this field",
      // distinct from the key being omitted, which means "leave unchanged".
      phone: z.string().regex(phoneRegex, 'Invalid phone number').nullable(),
      department: z.string().max(100).nullable(),
      designation: z.string().max(100).nullable(),
      salary: z.number().nonnegative().nullable(),
      joiningDate: z.coerce.date().nullable(),
      status: z.nativeEnum(EmployeeStatus),
      role: z.nativeEnum(Role),
      managerId: z.string().uuid().nullable(),
      profileImageUrl: profileImageUrlSchema.nullable(),
    })
    .partial(),
});

// Employees editing their own profile may only touch a limited set of fields.
export const updateOwnProfileSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      phone: z.string().regex(phoneRegex, 'Invalid phone number').nullable(),
      profileImageUrl: profileImageUrlSchema.nullable(),
      password: z.string().min(8),
    })
    .partial(),
});

export const assignManagerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    managerId: z.string().uuid().nullable(),
  }),
});

export const listEmployeesQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    department: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    sortBy: z.enum(['joiningDate', 'name']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
