import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.staffMember, {
      include: { photo: true },
      searchable: ['fullNameEn', 'fullNameTh', 'email'],
      filterable: ['status', 'isVisible'],
      dateField: 'createdAt',
      defaultOrder: { sortOrder: 'asc' },
    });
  }
}
