import { Body, Controller, Get, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { candidateProfileSchema, type CandidateProfile } from '@copilot/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ProfileService, type UploadedPdf } from './profile.service.js';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  async get(@CurrentUser() user: AuthUser) {
    return { profile: await this.profiles.get(user.id) };
  }

  @Put()
  update(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(candidateProfileSchema)) body: CandidateProfile) {
    return this.profiles.update(user.id, body);
  }

  @Post('cv')
  // Multer stops reading past the limit, so an oversized upload never fills memory.
  @UseInterceptors(FileInterceptor('cv', { limits: { fileSize: 5 * 1024 * 1024 + 1, files: 1 } }))
  importCv(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedPdf | undefined) {
    return this.profiles.importCv(user, file);
  }
}
