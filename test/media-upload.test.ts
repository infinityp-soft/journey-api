import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { MediaService } from '../src/media/media.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageDriver } from '../src/media/storage/storage.driver';

for (const format of ['jpeg', 'png', 'webp'] as const) {
  test(`stores ${format} bytes unchanged without running the optimizer`, async () => {
    const buffer = await sharp({ create: { width: 20, height: 10, channels: 3, background: '#f00' } })[format]().toBuffer();
    let stored: Buffer | undefined;
    const service = new MediaService({ mediaAsset: { create: async ({ data }: { data: unknown }) => data } } as unknown as PrismaService,
      { put: async (_key: string, data: Buffer) => { stored = data; } } as unknown as StorageDriver);
    service.optimizeToWebp = async () => { throw new Error('Must not encode during upload'); };
    const result = await service.upload({ buffer, mimetype: `image/${format}`, originalname: `test.${format}` } as Express.Multer.File);
    assert.equal(stored, buffer);
    assert.equal(result.mimeType, `image/${format}`);
    assert.equal(result.sizeBytes, buffer.length);
    assert.equal(result.width, 20);
    assert.equal(result.height, 10);
    assert.ok(result.storageKey.endsWith(format === 'jpeg' ? '.jpg' : `.${format}`));
  });
}
test('rejects invalid headers and spoofed content types before storage', async () => {
  const service = new MediaService({} as PrismaService, { put: async () => { throw new Error('Must not store invalid input'); } } as unknown as StorageDriver);
  await assert.rejects(service.upload({ buffer: Buffer.from('invalid'), mimetype: 'image/webp' } as Express.Multer.File), /Invalid or corrupt/);
  const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(service.upload({ buffer, mimetype: 'image/webp' } as Express.Multer.File), /Invalid image format/);
});
