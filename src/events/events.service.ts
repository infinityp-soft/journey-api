import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventStatus } from '../common/enums';
import { buildWhere } from '../common/crud/build-where';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventQueryDto,
  EventRegistrationQueryDto,
} from './dto/event-query.dto';
import {
  CreateEventDto,
  CreateEventRegistrationDto,
  UpdateEventDto,
  UpdateEventPageDto,
} from './dto/event.dto';
import { htmlSummary } from '../common/utils/html-summary';

const EVENT_INCLUDE = {
  coverImage: true,
  formFields: { orderBy: { sortOrder: 'asc' as const } },
} as const;

/** Statuses the public website shows and accepts registrations for. */
const OPEN_STATUSES: string[] = [EventStatus.scheduled, EventStatus.active];

type DateLike = string | Date | null | undefined;
const toTime = (v: DateLike) => (v ? new Date(v).getTime() : null);

/** End must not be before start, and registration must close after it opens. */
function assertDateOrder(d: {
  eventStartAt?: DateLike;
  eventEndAt?: DateLike;
  registrationOpenAt?: DateLike;
  registrationCloseAt?: DateLike;
}) {
  const start = toTime(d.eventStartAt), end = toTime(d.eventEndAt);
  if (start !== null && end !== null && end < start) {
    throw new BadRequestException('Event end must be after event start');
  }
  const open = toTime(d.registrationOpenAt), close = toTime(d.registrationCloseAt);
  if (open !== null && close !== null && close < open) {
    throw new BadRequestException('Registration close must be after registration open');
  }
}

/** The meeting link is for registrants/staff — never send it to the public site. */
function withoutOnlineUrl<T extends { onlineUrl?: string | null }>(row: T): Omit<T, 'onlineUrl'> {
  const copy: Partial<T> = { ...row };
  delete copy.onlineUrl;
  return copy as Omit<T, 'onlineUrl'>;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEventDto) {
    assertDateOrder(dto);
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

  /**
   * Scheduled/active events for the marketing website, soonest first.
   * Cards only need a teaser, so `description*` is a plain-text summary here;
   * `findPublicOne` serves the full HTML.
   */
  async findPublic() {
    const rows = await this.prisma.event.findMany({
      where: { status: { in: [EventStatus.scheduled, EventStatus.active] } },
      include: {
        coverImage: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { eventStartAt: 'asc' },
    });
    return rows.map((row) => ({
      ...withoutOnlineUrl(row),
      descriptionEn: htmlSummary(row.descriptionEn),
      descriptionTh: htmlSummary(row.descriptionTh),
    }));
  }

  /** Single scheduled/active event for the marketing website. */
  async findPublicOne(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, status: { in: [EventStatus.scheduled, EventStatus.active] } },
      include: {
        ...EVENT_INCLUDE,
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return withoutOnlineUrl(event);
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
    const current = await this.findOne(id);
    // Check the order against the values the event will have after the patch.
    const pick = <K extends keyof typeof current & keyof UpdateEventDto>(k: K) =>
      k in dto ? (dto[k] as DateLike) : (current[k] as DateLike);
    assertDateOrder({
      eventStartAt: pick('eventStartAt'),
      eventEndAt: pick('eventEndAt'),
      registrationOpenAt: pick('registrationOpenAt'),
      registrationCloseAt: pick('registrationCloseAt'),
    });
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
  async listRegistrations(eventId: string, query: EventRegistrationQueryDto) {
    await this.findOne(eventId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.EventRegistrationWhereInput = {
      eventId,
      ...buildWhere<Prisma.EventRegistrationWhereInput>(query, {
        searchable: ['firstName', 'lastName', 'email'],
        filterable: ['areaOfInterest'],
        dateField: 'registeredAt',
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where,
        orderBy: { registeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eventRegistration.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async register(eventId: string, dto: CreateEventRegistrationDto) {
    // One transaction with the event row locked, so concurrent sign-ups are
    // counted one at a time and can't overshoot maxRegistrants.
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');
      // Only events the public site shows (scheduled / active) take sign-ups.
      if (!OPEN_STATUSES.includes(event.status)) {
        throw new BadRequestException('Registration is not open for this event');
      }
      if (!event.registrationFormEnabled) {
        throw new BadRequestException('Registration is closed for this event');
      }
      const now = new Date();
      if (event.registrationOpenAt && now < event.registrationOpenAt) {
        throw new BadRequestException('Registration has not opened yet');
      }
      if (event.registrationCloseAt && now > event.registrationCloseAt) {
        throw new BadRequestException('Registration is closed for this event');
      }
      if (event.maxRegistrants != null) {
        const count = await tx.eventRegistration.count({ where: { eventId } });
        if (count >= event.maxRegistrants) {
          throw new BadRequestException('Event is full');
        }
      }
      return tx.eventRegistration.create({
        data: {
          ...dto,
          eventId,
          answers: (dto.answers ?? {}) as object,
        },
      });
    });
  }

  async removeRegistration(eventId: string, regId: string) {
    const reg = await this.prisma.eventRegistration.findFirst({
      where: { id: regId, eventId },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    await this.prisma.eventRegistration.delete({ where: { id: regId } });
  }

  /** Singleton settings for the public Events listing page (cover image). */
  async getPageSettings() {
    const existing = await this.prisma.eventPageSettings.findFirst({
      include: { headerImage: true },
    });
    if (existing) return existing;
    return this.prisma.eventPageSettings.create({
      data: {},
      include: { headerImage: true },
    });
  }

  async updatePageSettings(dto: UpdateEventPageDto) {
    const settings = await this.getPageSettings();
    // Blank titles are stored as null so the website falls back to its default text.
    const title = (value?: string | null) =>
      value === undefined ? undefined : value?.trim() || null;
    return this.prisma.eventPageSettings.update({
      where: { id: settings.id },
      data: {
        ...dto,
        pageTitleEn: title(dto.pageTitleEn),
        pageTitleTh: title(dto.pageTitleTh),
      },
      include: { headerImage: true },
    });
  }
}
