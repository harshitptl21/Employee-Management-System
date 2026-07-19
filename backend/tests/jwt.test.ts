import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { Role } from '@prisma/client';

describe('jwt utils', () => {
  const payload = { sub: 'employee-id-123', role: Role.EMPLOYEE, email: 'a@b.com' };

  it('signs and verifies an access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });

  it('signs and verifies a refresh token', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.email).toBe(payload.email);
  });

  it('throws when verifying a tampered token', () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
