import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { jobListQuerySchema, type JobListQuery } from '@copilot/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JobsService } from './jobs.service.js';

@Controller('jobs')
@UseGuards(AuthGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(jobListQuerySchema)) query: JobListQuery) {
    return this.jobs.list(user.id, query);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.detail(user.id, id);
  }
}
