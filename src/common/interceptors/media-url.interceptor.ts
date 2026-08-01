import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../config/configuration';

/**
 * Media rows only store a `storageKey`. This interceptor walks the response and
 * adds a fully-qualified public `url` (and `thumbnailUrl` placeholder) to any
 * object that looks like a media asset, wherever it appears in the tree.
 */
@Injectable()
export class MediaUrlInterceptor implements NestInterceptor {
  private readonly baseUrl: string;

  constructor(config: ConfigService<AppConfig>) {
    this.baseUrl = (
      config.get('media', { infer: true })!.publicUrl || '/media'
    ).replace(/\/$/, '');
  }

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.decorate(data)));
  }

  private decorate(node: unknown, seen = new WeakSet<object>()): unknown {
    if (Array.isArray(node)) return node.map((n) => this.decorate(n, seen));
    if (node && typeof node === 'object') {
      if (node instanceof Date) return node;
      if (seen.has(node)) return node;
      seen.add(node);
      const obj = node as Record<string, unknown>;
      if (typeof obj.storageKey === 'string' && obj.url === undefined) {
        obj.url = `${this.baseUrl}/${obj.storageKey}`;
      }
      for (const key of Object.keys(obj)) {
        obj[key] = this.decorate(obj[key], seen);
      }
      return obj;
    }
    return node;
  }
}
