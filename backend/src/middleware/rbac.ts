import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';

/** Restricts a route to the given roles. Must run after `authenticate`. */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

/** Allows self-access (req.params.id === req.user.sub) in addition to the given roles. */
export function authorizeSelfOrRoles(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    const isSelf = req.params.id === req.user.sub;
    const hasRole = allowedRoles.includes(req.user.role);
    if (!isSelf && !hasRole) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
