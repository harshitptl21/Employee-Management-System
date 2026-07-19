import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { catchAsync } from '@/utils/catchAsync';
import { ApiError } from '@/utils/ApiError';
import { isPrivilegedRole } from '@/utils/roles';
import * as employeeService from '@/services/employee.service';
import { importEmployeesFromCsv } from '@/services/csvImport.service';
import { saveProfilePhoto } from '@/services/photo.service';

export const listEmployees = catchAsync(async (req: Request, res: Response) => {
  const { search, department, role, status, sortBy, sortOrder, page, limit } = req.query as Record<
    string,
    string
  >;

  const result = await employeeService.listEmployees({
    search,
    department,
    role: role as Role | undefined,
    status: status as 'ACTIVE' | 'INACTIVE' | undefined,
    sortBy: sortBy as 'joiningDate' | 'name' | undefined,
    sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(200).json({ success: true, ...result });
});

export const getEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.status(200).json({ success: true, data: employee });
});

export const createEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.createEmployee(req.body, req.user!.role);
  res.status(201).json({ success: true, message: 'Employee created', data: employee });
});

export const updateEmployee = catchAsync(async (req: Request, res: Response) => {
  const isSelf = req.params.id === req.user!.sub;
  const isPrivileged = isPrivilegedRole(req.user!.role);

  // Self-editing employees get a narrower field set (see updateOwnProfileSchema).
  if (isSelf && !isPrivileged) {
    const employee = await employeeService.updateOwnProfile(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Profile updated', data: employee });
  }

  const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user!.role);
  res.status(200).json({ success: true, message: 'Employee updated', data: employee });
});

export const deleteEmployee = catchAsync(async (req: Request, res: Response) => {
  await employeeService.softDeleteEmployee(req.params.id);
  res.status(200).json({ success: true, message: 'Employee deleted (soft delete)' });
});

export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await employeeService.getDashboardStats();
  res.status(200).json({ success: true, data: stats });
});

export const importCsv = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('CSV file is required (field name: file)');
  }
  const result = await importEmployeesFromCsv(req.file.buffer);
  res.status(200).json({ success: true, message: 'Import complete', data: result });
});

export const uploadPhoto = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Image file is required (field name: photo)');
  }
  const employee = await saveProfilePhoto(req.params.id, req.file.buffer);
  res.status(200).json({ success: true, message: 'Profile photo updated', data: employee });
});
