import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DestinationsService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.destination, {
      include: { coverImage: true, flagImage: true },
      searchable: ['nameEn', 'nameTh'],
      filterable: ['status'],
      dateField: 'createdAt',
      defaultOrder: { sortOrder: 'asc' },
    });
  }
}
