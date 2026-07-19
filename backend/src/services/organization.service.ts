import { prisma } from '@/config/db';
import { ApiError } from '@/utils/ApiError';
import { PUBLIC_SELECT, requireActiveEmployee } from './employee.service';

export interface OrgNode {
  id: string;
  employeeCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  reports: OrgNode[];
}

/** Detects whether newManagerId is already a descendant of employeeId in the reporting chain. */
export async function wouldCreateCycle(employeeId: string, newManagerId: string): Promise<boolean> {
  let currentId: string | null = newManagerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === employeeId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current: { managerId: string | null } | null = await prisma.employee.findUnique({
      where: { id: currentId },
      select: { managerId: true },
    });
    currentId = current?.managerId ?? null;
  }

  return false;
}

/** Assigns/changes an employee's reporting manager, guarding against cycles. */
export async function assignManager(employeeId: string, managerId: string | null) {
  await requireActiveEmployee(employeeId);

  if (managerId) {
    if (managerId === employeeId) {
      throw ApiError.badRequest('An employee cannot report to themselves');
    }
    await requireActiveEmployee(managerId, 'Assigned manager does not exist');

    if (await wouldCreateCycle(employeeId, managerId)) {
      throw ApiError.badRequest('This assignment would create a circular reporting relationship');
    }
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data: { managerId },
    select: PUBLIC_SELECT,
  });
}

export async function getDirectReports(employeeId: string) {
  await requireActiveEmployee(employeeId);

  return prisma.employee.findMany({
    where: { managerId: employeeId, isDeleted: false },
    select: PUBLIC_SELECT,
  });
}

/** Builds the org tree in one query (O(n)) rather than recursing per node. */
export async function getOrganizationTree(): Promise<OrgNode[]> {
  const all = await prisma.employee.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      designation: true,
      department: true,
      managerId: true,
    },
  });

  const nodeMap = new Map<string, OrgNode>();
  for (const emp of all) {
    nodeMap.set(emp.id, {
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      reports: [],
    });
  }

  const roots: OrgNode[] = [];
  for (const emp of all) {
    const node = nodeMap.get(emp.id)!;
    if (emp.managerId && nodeMap.has(emp.managerId)) {
      nodeMap.get(emp.managerId)!.reports.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
