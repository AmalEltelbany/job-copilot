import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Env } from '../config/env.js';

export interface RateLimitOptions {
  limit: number;
  ttlMs: number;
}

const RATE_LIMIT = 'rate-limit';
const DEFAULT_LIMIT: RateLimitOptions = { limit: 300, ttlMs: 60_000 };

/** Tighter limit for a controller or route; the route's own decorator wins over its controller's. */
export const RateLimit = (limit: number, ttlMs = 60_000) => SetMetadata(RATE_LIMIT, { limit, ttlMs });

/**
 * Fixed-window rate limit per client IP and route, kept in memory.
 * We use this instead of @nestjs/throttler, which is still CommonJS and can't load the ESM-only Nest 12 on Vercel.
 * Trade-off: counts are per instance, so several serverless instances each allow the full limit.
 * A shared store (Redis) or the platform's firewall would make it exact.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  private readonly disabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService<Env, true>,
  ) {
    // The e2e suite registers dozens of users a minute; production keeps the limits.
    this.disabled = config.get('NODE_ENV') === 'test';
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.disabled || context.getType() !== 'http') return true;
    const { limit, ttlMs } =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT, [context.getHandler(), context.getClass()]) ??
      DEFAULT_LIMIT;
    const req = context.switchToHttp().getRequest<Request>();
    const key = `${clientIp(req)}:${context.getClass().name}.${context.getHandler().name}`;
    const now = Date.now();
    if (this.windows.size > 10_000) this.sweep(now);

    const window = this.windows.get(key);
    if (!window || window.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }
    window.count += 1;
    if (window.count > limit) {
      throw new HttpException('Too many requests, try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  private sweep(now: number) {
    for (const [key, window] of this.windows) if (window.resetAt <= now) this.windows.delete(key);
  }
}

function clientIp(req: Request) {
  // Vercel and Render set x-forwarded-for themselves, so the first entry is the real client.
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.ip || 'unknown';
}
