import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput, type UserDto } from '@copilot/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import type { Env } from '../config/env.js';
import { DemoService } from '../demo/demo.service.js';
import { AuthGuard, sessionClaims } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SESSION_COOKIE, sessionCookieOptions } from './session.js';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly demo: DemoService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput, @Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.auth.register(body));
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput, @Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.auth.login(body));
  }

  /** A throwaway account with a sample profile and pre-scored jobs. Demo accounts never call the paid model. */
  @Post('demo')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async startDemo(@Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.demo.createDemoUser());
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    const { maxAge: _maxAge, ...options } = sessionCookieOptions(this.isProduction());
    res.clearCookie(SESSION_COOKIE, options);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() current: AuthUser): Promise<UserDto> {
    const user = await this.auth.findById(current.id);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async startSession(res: Response, user: UserDto): Promise<UserDto> {
    const token = await this.jwt.signAsync(sessionClaims(user), { expiresIn: '7d' });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(this.isProduction()));
    return user;
  }

  private isProduction() {
    return this.config.get('NODE_ENV') === 'production';
  }
}
