import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { AuthUser } from '../../auth/casl/casl-ability.factory';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/** Skip noisy / sensitive routes from the activity feed. */
const SKIP_PREFIXES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/activity-logs',
  '/api/dashboard',
  '/api/analytics',
];

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
  constructor(private readonly activity: ActivityLogsService) {}

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

    const user = req.user;
    const { entityType, summary } = menuFromPath(path);
    const action = actionFromMethod(method);

    return next.handle().pipe(
      tap({
        next: (body) => {
          const entityId =
            (body &&
              typeof body === 'object' &&
              'id' in body &&
              typeof (body as { id: unknown }).id === 'string' &&
              (body as { id: string }).id) ||
            (typeof req.params?.id === 'string' ? req.params.id : undefined);

          void this.activity
            .record({
              userId: user?.id,
              action,
              entityType,
              entityId,
              summary: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${summary}`,
              metadata: { method, path },
            })
            .catch(() => undefined);
        },
      }),
    );
  }
}
