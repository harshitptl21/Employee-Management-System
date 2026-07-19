jest.mock('@/config/db', () => ({
  prisma: {
    employee: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/config/db';
import { updateEmployee } from '@/services/employee.service';
import { ApiError } from '@/utils/ApiError';
import { Role } from '@prisma/client';

function mockExisting(overrides: Partial<{ id: string; role: Role; managerId: string | null }> = {}) {
  (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
    id: 'emp-1',
    role: Role.EMPLOYEE,
    managerId: null,
    ...overrides,
  });
}

describe('updateEmployee — role-change enforcement', () => {
  afterEach(() => jest.clearAllMocks());

  it('allows an HR Manager to resubmit an unchanged HR_MANAGER role (no-op) without being rejected', async () => {
    mockExisting({ role: Role.HR_MANAGER });
    (prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp-1', role: Role.HR_MANAGER });

    await expect(
      updateEmployee('emp-1', { role: Role.HR_MANAGER, phone: '+15550000' }, Role.HR_MANAGER),
    ).resolves.toBeDefined();
  });

  it('rejects an HR Manager actually trying to change someone to HR_MANAGER', async () => {
    mockExisting({ role: Role.EMPLOYEE });

    await expect(
      updateEmployee('emp-1', { role: Role.HR_MANAGER }, Role.HR_MANAGER),
    ).rejects.toMatchObject({ statusCode: 403 } as Partial<ApiError>);
  });

  it('rejects an HR Manager trying to assign SUPER_ADMIN', async () => {
    mockExisting({ role: Role.EMPLOYEE });

    await expect(
      updateEmployee('emp-1', { role: Role.SUPER_ADMIN }, Role.HR_MANAGER),
    ).rejects.toMatchObject({ statusCode: 403 } as Partial<ApiError>);
  });

  it('allows a Super Admin to change a role freely', async () => {
    mockExisting({ role: Role.EMPLOYEE });
    (prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp-1', role: Role.HR_MANAGER });

    await expect(
      updateEmployee('emp-1', { role: Role.HR_MANAGER }, Role.SUPER_ADMIN),
    ).resolves.toBeDefined();
  });

  it('blocks anyone but a Super Admin from modifying an existing Super Admin, even with no role change', async () => {
    mockExisting({ role: Role.SUPER_ADMIN });

    await expect(
      updateEmployee('emp-1', { phone: '+15550000' }, Role.HR_MANAGER),
    ).rejects.toMatchObject({ statusCode: 403 } as Partial<ApiError>);
  });
});
