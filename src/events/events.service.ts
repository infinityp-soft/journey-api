import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildWhere } from '../common/crud/build-where';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventQueryDto } from './dto/event-query.dto';
import {
  CreateEventDto,
  CreateEventRegistrationDto,
  UpdateEventDto,
} from './dto/event.dto';

const EVENT_INCLUDE = {
  coverImage: true,
  formFields: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEventDto) {
    const { formFields, ...rest } = dto;
    return this.prisma.event.create({
      data: {
        ...rest,
        formFields: formFields?.length
          ? {
              create: formFields.map((f, i) => ({
                labelEn: f.labelEn,
                labelTh: f.labelTh,
                fieldType: f.fieldType,
                options: f.options ?? undefined,
                isRequired: f.isRequired ?? false,
                sortOrder: f.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: EVENT_INCLUDE,
    });
  }

  async findAll(query: EventQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildWhere<Prisma.EventWhereInput>(query, {
      searchable: ['nameEn', 'nameTh'],
      filterable: ['status', 'format'],
      dateField: 'eventStartAt',
    });

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          coverImage: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { eventStartAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: EVENT_INCLUDE,
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    const { formFields, ...rest } = dto;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        formFields: formFields
          ? {
              deleteMany: {},
              create: formFields.map((f, i) => ({
                labelEn: f.labelEn,
                labelTh: f.labelTh,
                fieldType: f.fieldType,
                options: f.options ?? undefined,
                isRequired: f.isRequired ?? false,
                sortOrder: f.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: EVENT_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.event.delete({ where: { id } });
  }

  // --- Registrations ---
  async listRegistrations(eventId: string, query: PaginationQueryDto) {
    await this.findOne(eventId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const [data, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where: { eventId },
        orderBy: { registeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eventRegistration.count({ where: { eventId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async register(eventId: string, dto: CreateEventRegistrationDto) {
    const event = await this.findOne(eventId);
    if (!event.registrationFormEnabled) {
      throw new BadRequestException('Registration is closed for this event');
    }
    if (event.maxRegistrants != null) {
      const count = await this.prisma.eventRegistration.count({
        where: { eventId },
      });
      if (count >= event.maxRegistrants) {
        throw new BadRequestException('Event is full');
      }
    }
    return this.prisma.eventRegistration.create({
      data: {
        ...dto,
        eventId,
        answers: (dto.answers ?? {}) as object,
      },
    });
  }

  async removeRegistration(eventId: string, regId: string) {
    const reg = await this.prisma.eventRegistration.findFirst({
      where: { id: regId, eventId },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    await this.prisma.eventRegistration.delete({ where: { id: regId } });
  }
}
