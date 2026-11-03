import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '../common/enums';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.testimonial, {
      include: { portraitImage: true, counselor: true },
      searchable: ['studentNameEn', 'studentNameTh', 'locationEn'],
      filterable: ['status', 'isFeatured', 'counselorId'],
      dateField: 'createdAt',
      defaultOrder: { updatedAt: 'desc' },
    });
  }

  /** Published testimonials for the marketing website, most recently updated first. */
  findPublic() {
    return this.model.findMany({
      where: { status: ReviewStatus.published },
      include: this.options.include,
      orderBy: this.defaultOrderBy,
      take: 20,
    });
  }
}
