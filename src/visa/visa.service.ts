import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildWhere } from '../common/crud/build-where';
import { PrismaService } from '../prisma/prisma.service';
import { VisaQueryDto } from './dto/visa-query.dto';
import { CreateVisaServiceDto, UpdateVisaServiceDto } from './dto/visa.dto';

const VISA_INCLUDE = {
  headerImage: true,
  documents: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class VisaService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVisaServiceDto) {
    const { documents, ...rest } = dto;
    return this.prisma.visaService.create({
      data: {
        ...rest,
        documents: documents?.length
          ? {
              create: documents.map((d, i) => ({
                labelEn: d.labelEn,
                labelTh: d.labelTh,
                sortOrder: d.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: VISA_INCLUDE,
    });
  }

  async findAll(query: VisaQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildWhere<Prisma.VisaServiceWhereInput>(query, {
      searchable: ['titleEn', 'titleTh', 'country'],
      filterable: ['status', 'country'],
      dateField: 'createdAt',
    });
    const [data, total] = await Promise.all([
      this.prisma.visaService.findMany({
        where,
        include: VISA_INCLUDE,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.visaService.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const service = await this.prisma.visaService.findUnique({
      where: { id },
      include: VISA_INCLUDE,
    });
    if (!service) throw new NotFoundException('Visa service not found');
    return service;
  }

  async update(id: string, dto: UpdateVisaServiceDto) {
    await this.findOne(id);
    const { documents, ...rest } = dto;
    return this.prisma.visaService.update({
      where: { id },
      data: {
        ...rest,
        // Replace the checklist wholesale when provided.
        documents: documents
          ? {
              deleteMany: {},
              create: documents.map((d, i) => ({
                labelEn: d.labelEn,
                labelTh: d.labelTh,
                sortOrder: d.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: VISA_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.visaService.delete({ where: { id } });
  }
}
