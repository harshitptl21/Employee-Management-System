import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '@/config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/** Only the hash is stored server-side, so a DB leak alone can't hand out usable refresh tokens. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
