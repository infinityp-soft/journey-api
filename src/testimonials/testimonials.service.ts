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
      defaultOrder: { sortOrder: 'asc' },
    });
  }

  /** Published testimonials for the marketing website, in the admin's sortOrder. */
  findPublic() {
    return this.model.findMany({
      where: { status: ReviewStatus.published },
      include: this.options.include,
      orderBy: this.options.defaultOrder,
      take: 20,
    });
  }
}
