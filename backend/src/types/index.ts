import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // employee id
  role: Role;
  email: string;
}

export interface AuthenticatedUser extends JwtPayload {}

// Augment Express Request with the authenticated user set by auth middleware
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
