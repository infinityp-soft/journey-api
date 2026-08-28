import { NotFoundException } from '@nestjs/common';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../dto/pagination-query.dto';
import { buildWhere, WhereOptions } from './build-where';

/**
 * Minimal shape shared by every Prisma model delegate (prisma.banner, etc.).
 * Typed loosely so a single generic service can drive all simple CRUD modules.
 */
export interface PrismaDelegate {
  create(args: any): Promise<any>;
  findMany(args?: any): Promise<any[]>;
  findUnique(args: any): Promise<any | null>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  count(args?: any): Promise<number>;
}

export interface CrudOptions extends WhereOptions {
  /** relations to include on find (Prisma `include`) */
  include?: Record<string, unknown>;
  /** default ordering when no ?sort is given */
  defaultOrder?: Record<string, 'asc' | 'desc'>;
}

/**
 * Generic CRUD service reused by the simple content modules. Handles
 * pagination, search, ordering and standard create/read/update/delete + reorder
 * on top of a Prisma model delegate.
 */
export class BasePrismaService<T = any> {
  constructor(
    protected readonly model: PrismaDelegate,
    protected readonly options: CrudOptions = {},
  ) {}

  create(data: any): Promise<T> {
    return this.model.create({ data, include: this.options.include });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<T>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = buildWhere(query, this.options);

    const orderBy = query.sort
      ? { [query.sort]: (query.order ?? 'asc').toLowerCase() }
      : (this.options.defaultOrder ?? { createdAt: 'desc' });

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        include: this.options.include,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.model.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.model.findUnique({
      where: { id },
      include: this.options.include,
    });
    if (!entity) throw new NotFoundException('Resource not found');
    return entity;
  }

  async update(id: string, data: any): Promise<T> {
    await this.findOne(id);
    return this.model.update({
      where: { id },
      data,
      include: this.options.include,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.model.delete({ where: { id } });
  }

  /** Bulk drag-and-drop reordering: [{ id, sortOrder }, ...] */
  async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      items.map((i) =>
        this.model.update({
          where: { id: i.id },
          data: { sortOrder: i.sortOrder },
        }),
      ),
    );
  }
}
