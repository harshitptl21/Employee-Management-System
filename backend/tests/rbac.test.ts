import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { authorize, authorizeSelfOrRoles } from '@/middleware/rbac';
import { ApiError } from '@/utils/ApiError';

function mockReqRes(user?: { sub: string; role: Role; email: string }, params: Record<string, string> = {}) {
  const req = { user, params } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn();
  return { req, res, next };
}

describe('authorize middleware', () => {
  it('calls next() with no error when the role is allowed', () => {
    const { req, res, next } = mockReqRes({ sub: '1', role: Role.SUPER_ADMIN, email: 'a@b.com' });
    authorize(Role.SUPER_ADMIN, Role.HR_MANAGER)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a 403 ApiError when the role is not allowed', () => {
    const { req, res, next } = mockReqRes({ sub: '1', role: Role.EMPLOYEE, email: 'a@b.com' });
    authorize(Role.SUPER_ADMIN, Role.HR_MANAGER)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it('forwards a 401 ApiError when there is no authenticated user', () => {
    const { req, res, next } = mockReqRes(undefined);
    authorize(Role.SUPER_ADMIN)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

describe('authorizeSelfOrRoles middleware', () => {
  it('allows an employee to act on their own record', () => {
    const { req, res, next } = mockReqRes({ sub: 'emp-1', role: Role.EMPLOYEE, email: 'a@b.com' }, { id: 'emp-1' });
    authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks an employee from acting on someone else\'s record', () => {
    const { req, res, next } = mockReqRes({ sub: 'emp-1', role: Role.EMPLOYEE, email: 'a@b.com' }, { id: 'emp-2' });
    authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('allows a privileged role regardless of whose record it is', () => {
    const { req, res, next } = mockReqRes({ sub: 'hr-1', role: Role.HR_MANAGER, email: 'a@b.com' }, { id: 'emp-2' });
    authorizeSelfOrRoles(Role.SUPER_ADMIN, Role.HR_MANAGER)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
