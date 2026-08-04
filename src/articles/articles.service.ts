import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '../common/enums';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { slugify } from '../common/utils/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

const ARTICLE_INCLUDE = {
  category: true,
  featuredImage: true,
  author: { select: { id: true, name: true, email: true, role: true } },
} as const;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(base: string, ignoreId?: string): Promise<string> {
    const root = slugify(base) || 'article';
    let slug = root;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await this.prisma.article.findUnique({ where: { slug } });
      if (!clash || clash.id === ignoreId) return slug;
      slug = `${root}-${++n}`;
    }
  }

  async create(dto: CreateArticleDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.titleEn);
    return this.prisma.article.create({
      data: {
        ...dto,
        slug,
        publishedAt:
          dto.status === PublishStatus.published ? new Date() : null,
      },
      include: ARTICLE_INCLUDE,
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { titleEn: { contains: query.search, mode: 'insensitive' as const } },
            { titleTh: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.slug && dto.slug !== article.slug) {
      data.slug = await this.uniqueSlug(dto.slug, id);
    }
    if (
      dto.status === PublishStatus.published &&
      article.status !== PublishStatus.published &&
      !article.publishedAt
    ) {
      data.publishedAt = new Date();
    }
    return this.prisma.article.update({
      where: { id },
      data,
      include: ARTICLE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.article.delete({ where: { id } });
  }
}
