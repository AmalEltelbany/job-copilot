import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ApplicationDto, ApplicationListItemDto, FitAssessment, UpdateApplicationInput } from '@copilot/shared';
import type { AuthUser } from '../common/request-context.js';
import { JobsService } from '../jobs/jobs.service.js';
import { toApplicationDto } from '../jobs/mappers.js';
import { LlmService } from '../llm/llm.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { draftWithVerification } from './drafting.js';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly llm: LlmService,
  ) {}

  async list(userId: string): Promise<ApplicationListItemDto[]> {
    const apps = await this.prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
    });
    return apps.map((a) => ({
      ...toApplicationDto(a),
      job: { id: a.job.id, title: a.job.title, company: a.job.company, url: a.job.url },
    }));
  }

  async start(userId: string, jobId: string): Promise<ApplicationDto> {
    const job = await this.jobs.owned(userId, jobId);
    if (job.application) throw new ConflictException('You already started an application for this job');
    return toApplicationDto(await this.prisma.application.create({ data: { userId, jobId } }));
  }

  async draft(user: AuthUser, applicationId: string): Promise<ApplicationDto> {
    const app = await this.owned(user.id, applicationId);
    const job = await this.jobs.owned(user.id, app.jobId);
    const profile = await this.jobs.loadProfile(user.id);
    if (!profile) throw new NotFoundException('Upload your CV first');

    const fit: FitAssessment | null = job.match
      ? {
          score: job.match.score,
          verdict: job.match.verdict,
          summary: job.match.summary,
          roleSeniority: job.match.roleSeniority as FitAssessment['roleSeniority'],
          requirements: job.match.requirements as FitAssessment['requirements'],
        }
      : null;
    const outcome = await draftWithVerification((purpose, call) => this.llm.run(user, purpose, call), profile.data, job, fit);

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        coverLetter: outcome.coverLetter,
        unsupportedClaims: outcome.unsupportedClaims,
        draftAttempts: { increment: outcome.attempts },
        status: app.status === 'SAVED' ? 'DRAFTED' : app.status,
      },
    });
    return toApplicationDto(updated);
  }

  async update(userId: string, applicationId: string, input: UpdateApplicationInput): Promise<ApplicationDto> {
    const app = await this.owned(userId, applicationId);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        ...input,
        // An edited letter is the user's own words now; earlier fact-check warnings no longer apply to it.
        ...(input.coverLetter !== undefined && input.coverLetter !== app.coverLetter ? { unsupportedClaims: [] } : {}),
        ...(input.status === 'APPLIED' && !app.appliedAt ? { appliedAt: new Date() } : {}),
      },
    });
    return toApplicationDto(updated);
  }

  async remove(userId: string, applicationId: string) {
    await this.owned(userId, applicationId);
    await this.prisma.application.delete({ where: { id: applicationId } });
  }

  private async owned(userId: string, applicationId: string) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app || app.userId !== userId) throw new NotFoundException('Application not found');
    return app;
  }
}
