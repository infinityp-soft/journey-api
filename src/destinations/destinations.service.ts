import { Injectable, NotFoundException } from '@nestjs/common';
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

  /** Single published destination for the marketing website. */
  async findPublicOne(id: string) {
    const destination = await this.model.findUnique({
      where: { id },
      include: this.options.include,
    });
    if (!destination || destination.status !== PublishStatus.published) {
      throw new NotFoundException('Destination not found');
    }
    return destination;
  }
}
