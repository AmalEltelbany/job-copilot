import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/** Shared by main.ts and the e2e tests, so tests run the same middleware as production. */
export function configureApp(app: INestApplication) {
  // Behind the web app's proxy (and the host's), so trust X-Forwarded-For for rate limiting.
  (app as NestExpressApplication).set('trust proxy', 1);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
}
