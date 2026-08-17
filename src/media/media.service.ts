import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

/** (table, column) pairs that reference media_assets — kept in sync with the schema. */
const MEDIA_REFERENCES: Array<[string, string]> = [
  ['users', 'avatar_id'],
  ['banners', 'image_id'],
  ['staff_members', 'photo_id'],
  ['destinations', 'cover_image_id'],
  ['articles', 'featured_image_id'],
  ['about_us', 'team_header_image_id'],
  ['visa_services', 'header_image_id'],
  ['testimonials', 'portrait_image_id'],
  ['videos', 'thumbnail_id'],
  ['video_page_settings', 'header_image_id'],
  ['events', 'cover_image_id'],
  ['site_settings', 'contact_cover_image_id'],
  ['site_settings', 'logo_id'],
];

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Longest edge after auto-orient; never upscale smaller assets (logos, icons). */
const MAX_IMAGE_DIMENSION = 2560;
/** WebP quality 1–100. 80 is a strong size/quality trade-off for CMS photos. */
const WEBP_QUALITY = 80;
/** CPU effort 0 (fastest) – 6 (smallest). Uploads are not a hot path. */
const WEBP_EFFORT = 6;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfig>,
  ) {
    this.uploadDir = config.get('media', { infer: true })!.uploadDir;
  }

  async upload(
    file: Express.Multer.File,
    uploadedById?: string,
    altText?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type (allowed: jpg, png, webp)',
      );
    }

    const output = await this.optimizeToWebp(file.buffer);

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const filename = `${randomUUID()}.webp`;
    const storageKey = path.posix.join(yyyy, mm, dd, filename);
    const absPath = path.join(this.uploadDir, yyyy, mm, dd, filename);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    // Atomic write: temp file then rename.
    const tmpPath = `${absPath}.tmp`;
    await fs.writeFile(tmpPath, output.data);
    await fs.rename(tmpPath, absPath);

    const checksum = createHash('sha256').update(output.data).digest('hex');

    return this.prisma.mediaAsset.create({
      data: {
        storageKey,
        originalFilename: file.originalname,
        mimeType: 'image/webp',
        sizeBytes: output.info.size,
        width: output.info.width ?? null,
        height: output.info.height ?? null,
        altText: altText ?? null,
        checksumSha256: checksum,
        uploadedById: uploadedById ?? null,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 40;
    const [data, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mediaAsset.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media not found');
    return asset;
  }

  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id);
    await this.deleteFile(asset.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
  }

  /** Auto-orient, cap the longest edge, strip metadata, encode as WebP. */
  private async optimizeToWebp(buffer: Buffer) {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: WEBP_QUALITY,
          effort: WEBP_EFFORT,
          smartSubsample: true,
        })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException('Invalid or corrupt image file');
    }
  }

  private async deleteFile(storageKey: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.uploadDir, storageKey));
    } catch (err) {
      this.logger.warn(`Could not delete file ${storageKey}: ${err}`);
    }
  }

  /**
   * Garbage-collect media rows not referenced by any FK and older than 24h,
   * removing both the DB row and the file on the volume.
   */
  async purgeUnreferenced(): Promise<number> {
    const union = MEDIA_REFERENCES.map(
      ([table, col]) =>
        `SELECT "${col}" AS id FROM "${table}" WHERE "${col}" IS NOT NULL`,
    ).join(' UNION ');

    const orphans = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; storage_key: string }>
    >(
      `SELECT m.id, m.storage_key
         FROM "media_assets" m
        WHERE m.created_at < now() - interval '1 day'
          AND NOT EXISTS (SELECT 1 FROM (${union}) r WHERE r.id = m.id)`,
    );

    if (orphans.length === 0) return 0;

    await Promise.all(orphans.map((o) => this.deleteFile(o.storage_key)));
    await this.prisma.mediaAsset.deleteMany({
      where: { id: { in: orphans.map((o) => o.id) } },
    });
    this.logger.log(`Purged ${orphans.length} unreferenced media asset(s)`);
    return orphans.length;
  }
}
