import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import {
  CreateArticleCategoryDto,
  UpdateArticleCategoryDto,
} from './dto/article.dto';

@Injectable()
export class ArticleCategoriesService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.articleCategory, {
      searchable: ['nameEn', 'nameTh'],
      defaultOrder: { sortOrder: 'asc' },
    });
  }

  create(dto: CreateArticleCategoryDto) {
    return super.create({ ...dto, slug: slugify(dto.slug || dto.nameEn) });
  }

  update(id: string, dto: UpdateArticleCategoryDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.slug) patch.slug = slugify(dto.slug);
    return super.update(id, patch);
  }
}
