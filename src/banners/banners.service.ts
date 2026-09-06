import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService extends BasePrismaService {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.banner, {
      include: { image: true },
      searchable: ['name'],
      filterable: ['isActive'],
      dateField: 'createdAt',
      defaultOrder: { sortOrder: 'asc' },
    });
  }

  /** Active banners for the marketing website's hero carousel. */
  findPublic() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      include: { image: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
