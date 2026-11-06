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
    });
  }

  /**
   * The admin's drag-and-drop order. New members start at sortOrder 0 and so
   * tie with the first row; createdAt puts the newest of them first.
   */
  protected get defaultOrderBy(): Record<string, 'asc' | 'desc'>[] {
    return [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];
  }

  /** Visible staff members for the marketing website, unpaginated. */
  findPublic() {
    return this.model.findMany({
      where: { isVisible: true },
      include: this.options.include,
      orderBy: this.defaultOrderBy,
    });
  }
}
