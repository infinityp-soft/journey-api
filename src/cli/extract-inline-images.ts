/**
 * One-off: move base64 `data:image/...` images out of rich-text HTML into media
 * storage and replace them with `/media/<storageKey>` references.
 *
 *   node dist/cli/extract-inline-images.js            # dry run (report only)
 *   node dist/cli/extract-inline-images.js --apply    # write changes
 *
 * Back up the database first. Images are optimized explicitly here before MediaService.upload.
 */
import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MediaService, RICH_TEXT_COLUMNS } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';

const DATA_URI = /data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\s]+)/g;

async function main() {
  const apply = process.argv.includes('--apply');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const media = app.get(MediaService);

  // Same image pasted into EN and TH (or several rows) is uploaded once.
  const uploaded = new Map<string, string>();
  let totalBefore = 0;
  let totalAfter = 0;
  let images = 0;

  for (const [table, col] of RICH_TEXT_COLUMNS) {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; html: string }>>(
      `SELECT id::text AS id, "${col}" AS html FROM "${table}" WHERE "${col}" LIKE '%data:image/%'`,
    );

    for (const row of rows) {
      const replacements = new Map<string, string>();
      for (const match of row.html.matchAll(DATA_URI)) {
        const [uri, , payload] = match;
        if (replacements.has(uri)) continue;
        const buffer = Buffer.from(payload.replace(/\s+/g, ''), 'base64');
        const hash = createHash('sha256').update(buffer).digest('hex');
        let src = uploaded.get(hash);
        if (!src) {
          if (apply) {
            const optimized = await media.optimizeToWebp(buffer);
            const asset = await media.upload({
              buffer: optimized.data,
              mimetype: 'image/webp',
              originalname: `inline-${hash.slice(0, 12)}.webp`,
            } as Express.Multer.File);
            src = `/media/${asset.storageKey}`;
          } else {
            src = `/media/(dry-run-${hash.slice(0, 12)}).webp`;
          }
          uploaded.set(hash, src);
          images++;
        }
        replacements.set(uri, src);
      }

      let html = row.html;
      for (const [uri, src] of replacements) html = html.split(uri).join(src);

      totalBefore += row.html.length;
      totalAfter += html.length;
      console.log(
        `${apply ? 'UPDATE' : 'DRY'} ${table}.${col} ${row.id}: ${replacements.size} image(s), ` +
          `${(row.html.length / 1e6).toFixed(2)} MB -> ${(html.length / 1e3).toFixed(1)} KB`,
      );

      if (apply && html !== row.html) {
        await prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "${col}" = $1 WHERE id = $2::uuid`,
          html,
          row.id,
        );
      }
    }
  }

  console.log(
    `${apply ? 'Done' : 'Dry run'}: ${images} unique image(s); ` +
      `${(totalBefore / 1e6).toFixed(2)} MB -> ${(totalAfter / 1e6).toFixed(2)} MB of HTML` +
      (apply ? '' : ' (re-run with --apply to write)'),
  );
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
