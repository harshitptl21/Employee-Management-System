import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

jest.mock('@/config/env', () => ({
  env: { uploadsDir: require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'ems-uploads-')) },
}));

jest.mock('@/config/db', () => ({
  prisma: {
    employee: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/config/db';
import { env } from '@/config/env';
import { saveProfilePhoto } from '@/services/photo.service';

async function samplePng(): Promise<Buffer> {
  return sharp({
    create: { width: 20, height: 20, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
}

describe('saveProfilePhoto', () => {
  afterAll(() => fs.rmSync(env.uploadsDir, { recursive: true, force: true }));
  afterEach(() => jest.clearAllMocks());

  it('writes a PNG named <employeeId>.png and updates profileImageUrl', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1', isDeleted: false });
    (prisma.employee.update as jest.Mock).mockImplementation(({ data }) => ({ id: 'emp-1', ...data }));

    const result = await saveProfilePhoto('emp-1', await samplePng());

    const filePath = path.join(env.uploadsDir, 'emp-1.png');
    expect(fs.existsSync(filePath)).toBe(true);
    expect((result as any).profileImageUrl).toBe('/uploads/emp-1.png');
  });

  it('normalizes a differently-shaped image into the fixed avatar size', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-2', isDeleted: false });
    (prisma.employee.update as jest.Mock).mockImplementation(({ data }) => ({ id: 'emp-2', ...data }));

    const wideImage = await sharp({
      create: { width: 800, height: 200, channels: 3, background: { r: 5, g: 5, b: 5 } },
    })
      .jpeg()
      .toBuffer();

    await saveProfilePhoto('emp-2', wideImage);

    const filePath = path.join(env.uploadsDir, 'emp-2.png');
    const metadata = await sharp(filePath).metadata();
    expect(metadata.width).toBe(metadata.height); // square crop regardless of source aspect ratio
    expect(metadata.format).toBe('png');
  });

  it('rejects a buffer that is not a valid image', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1', isDeleted: false });

    await expect(saveProfilePhoto('emp-1', Buffer.from('not an image'))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 if the employee does not exist or is deleted', async () => {
    (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(saveProfilePhoto('missing-id', await samplePng())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
