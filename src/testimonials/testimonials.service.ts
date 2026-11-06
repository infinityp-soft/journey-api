import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '../common/enums';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.testimonial, {
      include: { portraitImage: true, counselor: true },
      searchable: ['studentNameEn', 'studentNameTh', 'locationEn', 'institution'],
      filterable: ['status', 'isFeatured', 'counselorId'],
      dateField: 'createdAt',
    });
  }

  /**
   * The admin's drag-and-drop order. New testimonials start at sortOrder 0 and
   * so tie with the first row; createdAt puts the newest of them first.
   */
  protected get defaultOrderBy(): Record<string, 'asc' | 'desc'>[] {
    return [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];
  }

  /** Published testimonials for the marketing website, in the admin's order. */
  findPublic() {
    return this.model.findMany({
      where: { status: ReviewStatus.published },
      include: this.options.include,
      orderBy: this.defaultOrderBy,
      take: 20,
    });
  }
}
