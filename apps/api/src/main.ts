import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  await app.listen(app.get<ConfigService<Env, true>>(ConfigService).get('PORT'));
}
// Not a top-level await: Vercel's runtime captures listen() and waits for this module to finish loading first.
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
