import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { updateApplicationSchema, type UpdateApplicationInput } from '@copilot/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ApplicationsService } from './applications.service.js';

@Controller()
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get('applications')
  list(@CurrentUser() user: AuthUser) {
    return this.applications.list(user.id);
  }

  @Post('jobs/:jobId/application')
  start(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.applications.start(user.id, jobId);
  }

  @Post('applications/:id/draft')
  @HttpCode(200)
  // Each draft is up to four model calls; this keeps a stuck button from burning the daily budget.
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  draft(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.applications.draft(user, id);
  }

  @Patch('applications/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateApplicationSchema)) body: UpdateApplicationInput,
  ) {
    return this.applications.update(user.id, id, body);
  }

  @Delete('applications/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.applications.remove(user.id, id);
  }
}
