import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
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
                label: d.label,
                sortOrder: d.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: VISA_INCLUDE,
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.visaService.findMany({
        include: VISA_INCLUDE,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.visaService.count(),
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
                label: d.label,
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
