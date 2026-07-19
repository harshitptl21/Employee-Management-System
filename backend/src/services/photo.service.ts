import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/config/db';
import { ApiError } from '@/utils/ApiError';
import { env } from '@/config/env';
import { PUBLIC_SELECT, requireActiveEmployee } from './employee.service';

const AVATAR_SIZE = 512;

/**
 * Converts any supported upload (jpeg/png/webp/gif) into a fixed-size
 * square PNG saved at `<uploadsDir>/<employeeId>.png`. Using the employee
 * id as the filename means every profile photo has one predictable,
 * collision-free path, and re-uploading simply overwrites it in place —
 * no orphaned files, no need to store a generated filename in the DB.
 */
export async function saveProfilePhoto(employeeId: string, fileBuffer: Buffer) {
  await requireActiveEmployee(employeeId);

  fs.mkdirSync(env.uploadsDir, { recursive: true });
  const filePath = path.join(env.uploadsDir, `${employeeId}.png`);

  try {
    await sharp(fileBuffer).resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' }).png().toFile(filePath);
  } catch {
    throw ApiError.badRequest('Uploaded file is not a valid image');
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data: { profileImageUrl: `/uploads/${employeeId}.png` },
    select: PUBLIC_SELECT,
  });
}
