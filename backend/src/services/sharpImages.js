import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import crypto from 'node:crypto';

export async function sharpImages(file) {
  const fileName = crypto.randomUUID() + '.webp';

  const uploadDir = path.join(import.meta.dirname, '../../profileUploads');
  await fs.mkdir(uploadDir, { recursive: true });

  await sharp(file.buffer)
    .resize({ width: 500, height: 500, fit: 'cover' })
    .webp({ quality: 100 })
    .toFile(path.join(uploadDir, fileName));

  return fileName;
}
