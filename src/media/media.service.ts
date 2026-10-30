import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as path from 'path';
import sharp from 'sharp';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_DRIVER, StorageDriver } from './storage/storage.driver';

/** (table, column) pairs that reference media_assets — kept in sync with the schema. */
const MEDIA_REFERENCES: Array<[string, string]> = [
  ['users', 'avatar_id'],
  ['banners', 'image_id'],
  ['staff_members', 'photo_id'],
  ['destinations', 'cover_image_id'],
  ['destinations', 'flag_image_id'],
  ['articles', 'featured_image_id'],
  ['about_us', 'team_header_image_id'],
  ['visa_services', 'header_image_id'],
  ['testimonials', 'portrait_image_id'],
  ['videos', 'thumbnail_id'],
  ['video_page_settings', 'header_image_id'],
  ['article_page_settings', 'header_image_id'],
  ['events', 'cover_image_id'],
  ['site_settings', 'contact_cover_image_id'],
  ['site_settings', 'logo_id'],
];

/**
 * Rich-text (table, column) pairs whose HTML embeds `/media/<storageKey>` images
 * from the editor. They are not FKs, so GC must look inside them too.
 */
export const RICH_TEXT_COLUMNS: Array<[string, string]> = [
  ['about_us', 'bio_en'],
  ['about_us', 'bio_th'],
  ['destinations', 'content_en'],
  ['destinations', 'content_th'],
  ['articles', 'content_en'],
  ['articles', 'content_th'],
  ['visa_services', 'description_html_en'],
  ['visa_services', 'description_html_th'],
  ['testimonials', 'content_en'],
  ['testimonials', 'content_th'],
  ['events', 'description_en'],
  ['events', 'description_th'],
];

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** WebP quality 1–100. 82 is visually indistinguishable for photos at a fraction of 90's size. */
const WEBP_QUALITY = 82;
/** CPU effort 0 (fastest) – 6 (smallest). Uploads are not a hot path. */
const WEBP_EFFORT = 6;
/** Longest edge kept on upload — full-width heroes/banners are 1920px wide. */
export const MAX_IMAGE_DIMENSION = 1920;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

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

    let metadata: sharp.Metadata;
    try {
      // metadata() reads headers; it does not decode/resize/re-encode pixels.
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException('Invalid or corrupt image file');
    }
    const formats: Record<string, { extension: string; mimeType: string }> = {
      jpeg: { extension: 'jpg', mimeType: 'image/jpeg' },
      png: { extension: 'png', mimeType: 'image/png' },
      webp: { extension: 'webp', mimeType: 'image/webp' },
    };
    const format = formats[metadata.format ?? ''];
    if (
      !format ||
      format.mimeType !== file.mimetype ||
      !metadata.width ||
      !metadata.height
    ) {
      throw new BadRequestException('Invalid image format');
    }

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const filename = `${randomUUID()}.${format.extension}`;
    const storageKey = path.posix.join(yyyy, mm, dd, filename);

    await this.storage.put(storageKey, file.buffer, format.mimeType);

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    return this.prisma.mediaAsset.create({
      data: {
        storageKey,
        originalFilename: file.originalname,
        mimeType: format.mimeType,
        sizeBytes: file.buffer.length,
        width: metadata.width,
        height: metadata.height,
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
    await this.storage.delete(asset.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
  }

  /** Offline CLI maintenance only; never called by the upload endpoint. */
  async optimizeToWebp(buffer: Buffer) {
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

  /**
   * Garbage-collect media rows not referenced by any FK and older than 24h,
   * removing both the DB row and the stored object.
   */
  async purgeUnreferenced(): Promise<number> {
    const union = MEDIA_REFERENCES.map(
      ([table, col]) =>
        `SELECT "${col}" AS id FROM "${table}" WHERE "${col}" IS NOT NULL`,
    ).join(' UNION ');

    const inHtml = RICH_TEXT_COLUMNS.map(
      ([table, col]) =>
        `AND NOT EXISTS (SELECT 1 FROM "${table}" t WHERE strpos(t."${col}", m.storage_key) > 0)`,
    ).join('\n          ');

    const orphans = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; storage_key: string }>
    >(
      `SELECT m.id, m.storage_key
         FROM "media_assets" m
        WHERE m.created_at < now() - interval '1 day'
          AND NOT EXISTS (SELECT 1 FROM (${union}) r WHERE r.id = m.id)
          ${inHtml}`,
    );

    if (orphans.length === 0) return 0;

    await Promise.all(orphans.map((o) => this.storage.delete(o.storage_key)));
    await this.prisma.mediaAsset.deleteMany({
      where: { id: { in: orphans.map((o) => o.id) } },
    });
    this.logger.log(`Purged ${orphans.length} unreferenced media asset(s)`);
    return orphans.length;
  }
}
