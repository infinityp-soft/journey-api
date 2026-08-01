import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma.lead, {
      searchable: ['fullName', 'email', 'leadCode'],
      defaultOrder: { submittedAt: 'desc' },
    });
  }
}
