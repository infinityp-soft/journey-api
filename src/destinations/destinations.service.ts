import { Injectable } from '@nestjs/common';
import { PublishStatus } from '../common/enums';
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

  /** Published destinations for the marketing website, unpaginated. */
  findPublic() {
    return this.model.findMany({
      where: { status: PublishStatus.published },
      include: this.options.include,
      orderBy: this.options.defaultOrder,
    });
  }
}
