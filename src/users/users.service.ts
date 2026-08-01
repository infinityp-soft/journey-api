import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateProfileDto, UpdateUserDto } from './dto/user.dto';

/** Never leak the password hash to API responses. */
function sanitize<T extends { passwordHash?: unknown }>(user: T) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) throw new ConflictException('Email already in use');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        role: dto.role,
        avatarId: dto.avatarId ?? null,
        isActive: dto.isActive ?? true,
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
      include: { avatar: true },
    });
    return sanitize(user);
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        include: { avatar: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: data.map(sanitize),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Internal: returns the full record including the hash (for auth). */
  async findByIdRaw(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { avatar: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOne(id: string) {
    return sanitize(await this.findByIdRaw(id));
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findByIdRaw(id);
    const { password, email, ...rest } = dto;
    if (email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }
    const data: Record<string, unknown> = { ...rest };
    if (email) data.email = email.toLowerCase();
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { avatar: true },
    });
    return sanitize(user);
  }

  /**
   * Profile Settings modal: update own name / email / avatar.
   * Password is optional — omit or leave blank to keep the current one.
   */
  async updateProfile(id: string, dto: UpdateProfileDto) {
    const patch: UpdateUserDto = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.avatarId !== undefined) patch.avatarId = dto.avatarId ?? undefined;
    if (dto.password) patch.password = dto.password;
    return this.update(id, patch);
  }

  async remove(id: string) {
    await this.findByIdRaw(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findByIdRaw(id);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect');
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
  }
}
