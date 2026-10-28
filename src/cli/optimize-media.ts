/**
 * One-off: re-encode stored images that predate the upload size cap
 * (MAX_IMAGE_DIMENSION, WebP q82) and overwrite them under the same storage key,
 * so every existing `/media/...` URL keeps working.
 *
 *   node dist/cli/optimize-media.js            # dry run (report only)
 *   node dist/cli/optimize-media.js --apply    # write changes
 *
 * Back up media storage first (deploy/backup.sh media).
 */
import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MAX_IMAGE_DIMENSION, MediaService } from '../media/media.service';
import { STORAGE_DRIVER, StorageDriver } from '../media/storage/storage.driver';
import { PrismaService } from '../prisma/prisma.service';

/** Files below this are left alone unless they exceed the dimension cap. */
const MIN_BYTES = 300 * 1024;

async function main() {
  const apply = process.argv.includes('--apply');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const media = app.get(MediaService);
  const storage = app.get<StorageDriver>(STORAGE_DRIVER);

  const candidates = await prisma.mediaAsset.findMany({
    where: {
      OR: [
        { width: { gt: MAX_IMAGE_DIMENSION } },
        { height: { gt: MAX_IMAGE_DIMENSION } },
        { sizeBytes: { gt: MIN_BYTES } },
      ],
    },
    orderBy: { sizeBytes: 'desc' },
  });

  let before = 0;
  let after = 0;
  let changed = 0;

  for (const asset of candidates) {
    const object = await storage.get(asset.storageKey);
    if (!object) {
      console.warn(`MISSING ${asset.storageKey}`);
      continue;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of object.stream) chunks.push(Buffer.from(chunk));
    const original = Buffer.concat(chunks);

    const output = await media.optimizeToWebp(original);
    if (output.data.length >= original.length * 0.9) {
      console.log(`SKIP  ${asset.storageKey}: already small (${(original.length / 1e3).toFixed(0)} KB)`);
      continue;
    }

    before += original.length;
    after += output.data.length;
    changed++;
    console.log(
      `${apply ? 'WRITE' : 'DRY  '} ${asset.storageKey}: ${asset.width}x${asset.height} ` +
        `${(original.length / 1e3).toFixed(0)} KB -> ${output.info.width}x${output.info.height} ` +
        `${(output.data.length / 1e3).toFixed(0)} KB`,
    );

    if (apply) {
      await storage.put(asset.storageKey, output.data, 'image/webp');
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          mimeType: 'image/webp',
          sizeBytes: output.info.size,
          width: output.info.width ?? null,
          height: output.info.height ?? null,
          checksumSha256: createHash('sha256').update(output.data).digest('hex'),
        },
      });
    }
  }

  console.log(
    `${apply ? 'Done' : 'Dry run'}: ${changed} of ${candidates.length} candidate(s), ` +
      `${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB` +
      (apply ? '' : ' (re-run with --apply to write)'),
  );
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
