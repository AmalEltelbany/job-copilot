import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CandidateProfile, ProfileDto } from '@copilot/shared';
import type { AuthUser } from '../common/request-context.js';
import { candidateProfileSchema } from '@copilot/shared';
import { LlmService } from '../llm/llm.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsService } from '../jobs/jobs.service.js';

const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** The parts of a Multer upload we use. */
export interface UploadedPdf {
  buffer: Buffer;
  originalname: string;
  size: number;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly jobs: JobsService,
  ) {}

  async get(userId: string): Promise<ProfileDto | null> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    return profile ? toDto(profile) : null;
  }

  async require(userId: string): Promise<{ version: number; data: CandidateProfile }> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Upload your CV first');
    return { version: profile.version, data: candidateProfileSchema.parse(profile.data) };
  }

  async importCv(user: AuthUser, file: UploadedPdf | undefined) {
    if (!file) throw new BadRequestException('Attach your CV as a PDF');
    if (file.size > MAX_PDF_BYTES) throw new BadRequestException('The PDF must be 5 MB or smaller');
    // Trust the bytes, not the browser-supplied MIME type.
    if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new BadRequestException('That file is not a PDF');

    const data = await this.llm.run(user, 'extract-profile', (p) => p.extractProfile(file.buffer));
    return this.save(user.id, data, file.originalname);
  }

  async update(userId: string, data: CandidateProfile) {
    return this.save(userId, data, undefined);
  }

  private async save(userId: string, data: CandidateProfile, sourceFileName: string | undefined): Promise<ProfileDto> {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, data, sourceFileName: sourceFileName ?? null },
      update: { data, version: { increment: 1 }, ...(sourceFileName !== undefined ? { sourceFileName } : {}) },
    });
    // Filters and scores depend on the profile, so re-run them against the new version.
    await this.jobs.reassessAll(userId, data);
    return toDto(profile);
  }
}

function toDto(profile: { version: number; data: unknown; sourceFileName: string | null; updatedAt: Date }): ProfileDto {
  return {
    version: profile.version,
    data: candidateProfileSchema.parse(profile.data),
    sourceFileName: profile.sourceFileName,
    updatedAt: profile.updatedAt.toISOString(),
  };
}
