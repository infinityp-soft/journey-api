import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.banner, {
      include: { image: true },
      searchable: ['name'],
      filterable: ['isActive'],
      dateField: 'createdAt',
      defaultOrder: { sortOrder: 'asc' },
    });
  }
}
