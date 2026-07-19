import { prisma } from '@/config/db';
import { ApiError } from '@/utils/ApiError';
import { comparePassword, hashToken } from '@/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { env } from '@/config/env';

function msFromExpiry(expiry: string): number {
  // supports formats like "15m", "7d", "1h"
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 60_000;
  return value * unitMs;
}

export async function login(email: string, password: string) {
  const employee = await prisma.employee.findFirst({
    where: { email, isDeleted: false },
  });

  if (!employee) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (employee.status === 'INACTIVE') {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  const isValid = await comparePassword(password, employee.password);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const payload = { sub: employee.id, role: employee.role, email: employee.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      employeeId: employee.id,
      expiresAt: new Date(Date.now() + msFromExpiry(env.jwtRefreshExpiresIn)),
    },
  });

  const { password: _pw, ...safeEmployee } = employee;
  return { accessToken, refreshToken, employee: safeEmployee };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid, please log in again');
  }

  const employee = await prisma.employee.findFirst({
    where: { id: payload.sub, isDeleted: false },
  });
  if (!employee || employee.status === 'INACTIVE') {
    throw ApiError.unauthorized('Account is not available');
  }

  const newPayload = { sub: employee.id, role: employee.role, email: employee.email };
  const accessToken = signAccessToken(newPayload);
  return { accessToken };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}
