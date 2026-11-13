import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildWhere } from '../common/crud/build-where';
import { PrismaService } from '../prisma/prisma.service';
import { UserQueryDto } from './dto/user-query.dto';
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

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildWhere<Prisma.UserWhereInput>(query, {
      searchable: ['name', 'email'],
      filterable: ['role', 'isActive'],
      dateField: 'createdAt',
    });
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { avatar: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  /** Throws if the change would leave the system without an active admin. */
  private async assertKeepsAnAdmin(target: { id: string; role: string; isActive: boolean }) {
    if (target.role !== 'admin' || !target.isActive) return;
    const others = await this.prisma.user.count({
      where: { role: 'admin', isActive: true, id: { not: target.id } },
    });
    if (others === 0) {
      throw new BadRequestException('Cannot remove, deactivate or demote the last active admin');
    }
  }

  /** Signs the user out everywhere (their refresh tokens stop working). */
  private revokeSessions(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findByIdRaw(id);
    const demoting = dto.role !== undefined && dto.role !== current.role;
    const deactivating = dto.isActive === false && current.isActive;
    if (demoting || deactivating) await this.assertKeepsAnAdmin(current);
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
    if (demoting || deactivating) await this.revokeSessions(id);
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

  async remove(id: string, actorId?: string) {
    const target = await this.findByIdRaw(id);
    if (actorId && actorId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.assertKeepsAnAdmin(target);
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
