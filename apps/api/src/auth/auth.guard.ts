import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser, AuthedRequest } from '../common/request-context.js';
import { SESSION_COOKIE } from './session.js';

interface SessionClaims {
  sub: string;
  email: string;
  name: string;
  demo: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string') throw new UnauthorizedException();
    try {
      const claims = await this.jwt.verifyAsync<SessionClaims>(token);
      request.user = { id: claims.sub, email: claims.email, name: claims.name, isDemo: claims.demo };
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export function sessionClaims(user: AuthUser): SessionClaims {
  return { sub: user.id, email: user.email, name: user.name, demo: user.isDemo };
}
