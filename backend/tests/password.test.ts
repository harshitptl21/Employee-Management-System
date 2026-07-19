import { hashPassword, comparePassword, hashToken } from '@/utils/password';

describe('password utils', () => {
  it('hashes a password and can verify it against the original', async () => {
    const plain = 'SuperSecret123!';
    const hashed = await hashPassword(plain);

    expect(hashed).not.toEqual(plain);
    await expect(comparePassword(plain, hashed)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hashed = await hashPassword('CorrectPassword1!');
    await expect(comparePassword('WrongPassword1!', hashed)).resolves.toBe(false);
  });

  it('produces a deterministic SHA-256 hash for refresh tokens', () => {
    const token = 'sample.jwt.token';
    expect(hashToken(token)).toEqual(hashToken(token));
    expect(hashToken(token)).not.toEqual(token);
  });
});
