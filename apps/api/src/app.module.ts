import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RateLimitGuard } from './common/rate-limit.js';
import { validateEnv } from './config/env.js';
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
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
