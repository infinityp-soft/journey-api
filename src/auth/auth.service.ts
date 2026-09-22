import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, RefreshPayload } from './jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig>,
    private readonly mailService: MailService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private strip(user: User): SafeUser {
    const { passwordHash: _drop, ...rest } = user;
    return rest;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(
    email: string,
    password: string,
    ctx: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthTokens & { user: SafeUser }> {
    const user = await this.validateUser(email, password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const tokens = await this.issueTokens(user, ctx);
    return { ...tokens, user: this.strip(user) };
  }

  private async issueTokens(
    user: User,
    ctx: { userAgent?: string; ip?: string },
  ): Promise<AuthTokens> {
    const jwtCfg = this.config.get('jwt', { infer: true })!;

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: jwtCfg.accessSecret,
      expiresIn: jwtCfg.accessTtl,
    });

    const jti = randomUUID();
    const refreshPayload: RefreshPayload = { sub: user.id, jti };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: jwtCfg.refreshSecret,
      expiresIn: jwtCfg.refreshTtl,
    });

    // Persist the hash so tokens can be rotated/revoked.
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ip ?? null,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    rawToken: string,
    ctx: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthTokens> {
    const jwtCfg = this.config.get('jwt', { infer: true })!;
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(rawToken, {
        secret: jwtCfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    // Rotate: revoke the used token, issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user, ctx);
  }

  async logout(rawToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (stored && !stored.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  /** Housekeeping: drop expired refresh tokens. */
  async purgeExpired(): Promise<number> {
    const res = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return res.count;
  }

  /**
   * Request a password reset link sent to the user's email.
   * Returns a generic message to prevent email enumeration.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const genericMessage =
      'If your email is registered in our system, a password reset link has been sent. Please check your inbox.';

    if (!user || !user.isActive) {
      return { message: genericMessage };
    }

    // 1. Generate a secure random token (32 bytes = 64 hex characters)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    // 2. Invalidate any existing unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 3. Store the hashed token in database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 4. Construct the reset URL pointing to Web Admin frontend
    const webAdminBaseUrl =
      this.config.get<string>('webAdminBaseUrl') || 'http://localhost:3002';
    const resetLink = `${webAdminBaseUrl}/en/reset-password?token=${rawToken}`;

    // 5. Send email via Resend
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetLink,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}: ${(err as Error).message}`,
      );
    }

    return { message: genericMessage };
  }

  /**
   * Verify if a reset token is valid and active before rendering reset form.
   */
  async verifyResetToken(rawToken: string): Promise<{ valid: boolean }> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('Reset token is required.');
    }

    const tokenHash = this.hash(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }

    return { valid: true };
  }

  /**
   * Reset user's password using the verified token.
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('Reset token is required.');
    }

    const tokenHash = this.hash(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }

    if (!record.user || !record.user.isActive) {
      throw new BadRequestException('User account is inactive or not found.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      // Update password
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      // Invalidate the reset token (single-use)
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all active sessions for this user across all devices
      this.prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
      // Audit log entry
      this.prisma.activityLog.create({
        data: {
          userId: record.userId,
          action: 'auth.reset_password',
          summary: 'Password was successfully reset via email token',
        },
      }),
    ]);

    return { message: 'Password has been successfully updated.' };
  }
}
