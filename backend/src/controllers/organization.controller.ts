import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import * as orgService from '@/services/organization.service';

export const getOrganizationTree = catchAsync(async (_req: Request, res: Response) => {
  const tree = await orgService.getOrganizationTree();
  res.status(200).json({ success: true, data: tree });
});

export const getReportees = catchAsync(async (req: Request, res: Response) => {
  const reportees = await orgService.getDirectReports(req.params.id);
  res.status(200).json({ success: true, data: reportees });
});

export const assignManager = catchAsync(async (req: Request, res: Response) => {
  const updated = await orgService.assignManager(req.params.id, req.body.managerId ?? null);
  res.status(200).json({ success: true, message: 'Reporting manager updated', data: updated });
});
