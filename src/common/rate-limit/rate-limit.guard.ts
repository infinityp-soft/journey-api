import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
  /** Also key by a body field (e.g. `email` for login) so one IP can't lock out everyone. */
  bodyKey?: string;
  /**
   * Backstop that ignores the client IP (still split by `bodyKey`). The IP comes
   * from X-Forwarded-For, which a client can forge to look like many clients;
   * this cap still holds when that happens.
   */
  overall?: { limit: number; windowSec: number };
}

export const RATE_LIMIT_KEY = 'rateLimit';
/** Per-client fixed-window limit for a public route (in-memory, single API instance). */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Client IP. The browser reaches the API through the Next.js rewrite, which
 * sets X-Forwarded-For to the client address when the client didn't send one.
 * A client can send its own value, so this is only good for telling honest
 * clients apart — `overall` limits are the backstop against forged values.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const list = (Array.isArray(fwd) ? fwd.join(',') : fwd ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list[list.length - 1] || req.ip || req.socket.remoteAddress || 'unknown';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private lastSweep = 0;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    this.sweep(now);

    const extra =
      options.bodyKey && req.body && typeof req.body === 'object'
        ? String((req.body as Record<string, unknown>)[options.bodyKey] ?? '').toLowerCase()
        : '';
    const route = `${context.getClass().name}.${context.getHandler().name}`;

    this.hit(`${route}|${clientIp(req)}|${extra}`, options.limit, options.windowSec, now, res);
    if (options.overall) {
      this.hit(`${route}|*|${extra}`, options.overall.limit, options.overall.windowSec, now, res);
    }
    return true;
  }

  private hit(key: string, limit: number, windowSec: number, now: number, res: Response) {
    let entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowSec * 1000 };
      this.hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Drop expired windows now and then so the map can't grow without bound. */
  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
  }
}
