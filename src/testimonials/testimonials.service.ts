import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.testimonial, {
      include: { portraitImage: true, counselor: true },
      searchable: ['studentNameEn', 'studentNameTh', 'locationEn'],
      defaultOrder: { sortOrder: 'asc' },
    });
  }
}
