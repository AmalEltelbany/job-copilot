import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { createSourceSchema, type CreateSourceInput } from '@copilot/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { SourcesService } from './sources.service.js';

@Controller('sources')
@UseGuards(AuthGuard)
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.sources.list(user.id);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createSourceSchema)) body: CreateSourceInput) {
    await this.sources.create(user, body);
    return this.sources.list(user.id);
  }

  @Post(':id/sync')
  @HttpCode(202)
  async sync(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.sources.requestSync(user, id);
    return { queued: true };
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sources.remove(user.id, id);
  }
}
