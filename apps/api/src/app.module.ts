import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv, type Env } from './config/env.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { LlmModule } from './llm/llm.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { QueueModule } from './queue/queue.module.js';
import { SourcesModule } from './sources/sources.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [{ ttl: 60_000, limit: 300 }],
        // The e2e suite creates many users a minute; production keeps the limits.
        skipIf: () => config.get('NODE_ENV') === 'test',
      }),
    }),
    PrismaModule,
    QueueModule,
    LlmModule,
    AuthModule,
    JobsModule,
    ProfileModule,
    SourcesModule,
    ApplicationsModule,
  ],
  controllers: [HealthController, DashboardController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
