import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { from, Observable, switchMap, tap } from 'rxjs';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { AuthUser } from '../../auth/casl/casl-ability.factory';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/** Skip noisy / sensitive routes from the activity feed. */
const SKIP_PREFIXES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/activity-logs',
  '/api/dashboard',
  '/api/analytics',
  // Media uploads happen as a side step of saving another record (cover,
  // photo, editor image) and would show up as a second row at the same time.
  '/api/media-assets',
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Field names that hold a record's display name, in order of preference. */
const NAME_KEYS = [
  'titleEn',
  'nameEn',
  'fullNameEn',
  'labelEn',
  'name',
  'title',
  'titleTh',
  'nameTh',
  'fullNameTh',
  'labelTh',
  'firstName',
];

/** Best-effort display name of the record a mutation returned. */
function recordName(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  for (const key of NAME_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      const name = value.trim();
      return name.length > 80 ? `${name.slice(0, 77)}...` : name;
    }
  }
  return undefined;
}

/** Prisma delegate per URL root, used to read a record's name before it is deleted. */
const DELEGATE_BY_ROOT: Record<string, string> = {
  banners: 'banner',
  staff: 'staffMember',
  destinations: 'destination',
  articles: 'article',
  'article-categories': 'articleCategory',
  'visa-services': 'visaService',
  testimonials: 'testimonial',
  videos: 'video',
  events: 'event',
  leads: 'lead',
  users: 'user',
};

/** Sub-action from the path, e.g. /api/events/:id/status → "status". */
function subAction(path: string): string | undefined {
  const segments = path
    .replace(/^\/api\/?/, '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .slice(1)
    .filter((segment) => !UUID_RE.test(segment));
  return segments.length ? segments.join(' ') : undefined;
}

function actionFromMethod(method: string): string {
  switch (method) {
    case 'POST':
      return 'created';
    case 'PATCH':
    case 'PUT':
      return 'updated';
    case 'DELETE':
      return 'deleted';
    default:
      return method.toLowerCase();
  }
}

/** Derive a human menu label from the URL path, e.g. /api/banners/… → Banner. */
function menuFromPath(path: string): { entityType: string; summary: string } {
  const clean = path.replace(/^\/api\/?/, '').split('?')[0];
  const segments = clean.split('/').filter(Boolean);
  const root = segments[0] ?? 'unknown';

  const labels: Record<string, string> = {
    banners: 'Banner',
    'about-us': 'About Us',
    staff: 'Staff',
    destinations: 'Destination',
    articles: 'Article',
    'article-categories': 'Article Category',
    'visa-services': 'Visa Requirements',
    testimonials: 'Testimonial',
    videos: 'Video',
    events: 'Event',
    leads: 'Lead',
    settings: 'Global Settings',
    users: 'User Permissions',
    'media-assets': 'Media',
    auth: 'Profile',
  };

  const label = labels[root] ?? root;
  return { entityType: root, summary: label };
}

/**
 * Records mutating CMS actions into activity_logs so the Dashboard
 * "User Activity Log" stays populated without each service calling record().
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activity: ActivityLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /** DELETE answers 204 with no body — read the record's name while it still exists. */
  private async nameBeforeDelete(root: string, id: unknown): Promise<string | undefined> {
    const delegateName = DELEGATE_BY_ROOT[root];
    if (!delegateName || typeof id !== 'string' || !UUID_RE.test(id)) return undefined;
    const delegate = (this.prisma as unknown as Record<string, { findUnique?: (args: unknown) => Promise<unknown> }>)[delegateName];
    if (!delegate?.findUnique) return undefined;
    try {
      return recordName(await delegate.findUnique({ where: { id } }));
    } catch {
      return undefined;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      Request & { user?: AuthUser }
    >();
    const method = (req.method ?? '').toUpperCase();

    if (!MUTATING.has(method)) return next.handle();

    const path = req.originalUrl || req.url || '';
    if (SKIP_PREFIXES.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    // Only CMS users' actions belong in the activity feed. Public website
    // calls (article views, lead/event sign-ups, password reset) have no user
    // and used to flood the log with anonymous "Created …" rows.
    const user = req.user;
    if (!user?.id) return next.handle();

    const { entityType, summary } = menuFromPath(path);
    const action = actionFromMethod(method);
    const namePromise: Promise<string | undefined> =
      method === 'DELETE'
        ? this.nameBeforeDelete(entityType, req.params?.id)
        : Promise.resolve(undefined);

    return from(namePromise).pipe(
      switchMap((deletedName) => next.handle().pipe(
      tap({
        next: (body) => {
          const entityId =
            (body &&
              typeof body === 'object' &&
              'id' in body &&
              typeof (body as { id: unknown }).id === 'string' &&
              (body as { id: string }).id) ||
            (typeof req.params?.id === 'string' ? req.params.id : undefined);

          const name = recordName(body) ?? deletedName;
          // "/auth/me" is the user's own profile — the label already says so.
          const rawDetail = subAction(path);
          const detail = entityType === 'auth' && rawDetail === 'me' ? undefined : rawDetail;
          const verb = `${action.charAt(0).toUpperCase()}${action.slice(1)}`;
          const text = [
            `${verb} ${summary}`,
            detail ? ` (${detail})` : '',
            name ? `: "${name}"` : '',
          ].join('');

          void this.activity
            .record({
              userId: user.id,
              action,
              entityType,
              entityId,
              summary: text,
              metadata: { method, path, menu: summary, name, detail },
            })
            .catch(() => undefined);
        },
      }),
      )),
    );
  }
}
