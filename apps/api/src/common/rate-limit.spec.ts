import { HttpException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Env } from '../config/env.js';
import { RateLimit, RateLimitGuard } from './rate-limit.js';

class Controller {
  @RateLimit(2)
  login() {}

  open() {}
}

const config = (NODE_ENV: Env['NODE_ENV']) => ({ get: () => NODE_ENV }) as unknown as ConfigService<Env, true>;

function contextFor(handler: () => void, ip: string) {
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } }) }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  it('rejects requests over the route limit, per client IP', () => {
    const guard = new RateLimitGuard(new Reflector(), config('production'));
    const login = Controller.prototype.login;
    expect(guard.canActivate(contextFor(login, '1.1.1.1'))).toBe(true);
    expect(guard.canActivate(contextFor(login, '1.1.1.1'))).toBe(true);
    expect(() => guard.canActivate(contextFor(login, '1.1.1.1'))).toThrow(HttpException);
    expect(guard.canActivate(contextFor(login, '2.2.2.2'))).toBe(true);
  });

  it('applies the default limit to undecorated routes', () => {
    const guard = new RateLimitGuard(new Reflector(), config('production'));
    for (let i = 0; i < 300; i++) guard.canActivate(contextFor(Controller.prototype.open, '1.1.1.1'));
    expect(() => guard.canActivate(contextFor(Controller.prototype.open, '1.1.1.1'))).toThrow(HttpException);
  });

  it('is off in tests', () => {
    const guard = new RateLimitGuard(new Reflector(), config('test'));
    for (let i = 0; i < 5; i++) expect(guard.canActivate(contextFor(Controller.prototype.login, '1.1.1.1'))).toBe(true);
  });
});
