import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PublishStatus } from '../common/enums';
import { buildWhere } from '../common/crud/build-where';
import { slugify } from '../common/utils/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleQueryDto } from './dto/article-query.dto';
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
    const data: Record<string, unknown> = {
      ...dto,
      slug,
      publishedAt:
        dto.status === PublishStatus.published ? new Date() : null,
    };

    if (dto.categoryId) {
      const catExists = await this.prisma.articleCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!catExists) {
        delete data.categoryId;
      }
    }

    if (dto.featuredImageId) {
      const imgExists = await this.prisma.mediaAsset.findUnique({
        where: { id: dto.featuredImageId },
      });
      if (!imgExists) {
        delete data.featuredImageId;
      }
    }

    return this.prisma.article.create({
      data: data as Prisma.ArticleCreateInput,
      include: ARTICLE_INCLUDE,
    });
  }

  async findAll(query: ArticleQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildWhere<Prisma.ArticleWhereInput>(query, {
      searchable: ['titleEn', 'titleTh'],
      filterable: ['status', 'categoryId', 'isVisible'],
      dateField: 'createdAt',
    });

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

  /** Published/visible articles for the marketing website, newest first. */
  findPublic() {
    return this.prisma.article.findMany({
      where: { status: PublishStatus.published, isVisible: true },
      include: ARTICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /** Single published/visible article by slug for the marketing website. */
  async findPublicBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE,
    });
    if (
      !article ||
      article.status !== PublishStatus.published ||
      !article.isVisible
    ) {
      throw new NotFoundException('Article not found');
    }
    return article;
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

    if (dto.categoryId) {
      const catExists = await this.prisma.articleCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!catExists) {
        delete data.categoryId;
      }
    }

    if (dto.featuredImageId) {
      const imgExists = await this.prisma.mediaAsset.findUnique({
        where: { id: dto.featuredImageId },
      });
      if (!imgExists) {
        delete data.featuredImageId;
      }
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
