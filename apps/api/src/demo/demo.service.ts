import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import type { UserDto } from '@copilot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { SAMPLE_JOBS, SAMPLE_PROFILE } from './fixtures.js';

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  /** A throwaway account with a sample profile and sample jobs, scored straight away by the fake provider. */
  async createDemoUser(): Promise<UserDto> {
    const suffix = randomBytes(4).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: `demo-${suffix}@demo.job-copilot.dev`,
        name: `Guest ${suffix.slice(0, 4)}`,
        passwordHash: await argon2.hash(randomBytes(24).toString('hex')),
        isDemo: true,
        profile: { create: { data: SAMPLE_PROFILE, sourceFileName: 'sample-cv.pdf' } },
        sources: { create: { kind: 'GREENHOUSE', identifier: 'demo-board', label: 'Sample job board', lastSyncedAt: new Date() } },
      },
      include: { sources: true },
    });

    await this.jobs.storeFetchedJobs(
      user.id,
      user.sources[0].id,
      SAMPLE_JOBS.map((job) => ({
        ...job,
        url: `https://example.com/jobs/${job.externalId}`,
        applyUrl: `https://example.com/jobs/${job.externalId}/apply`,
        postedAt: new Date(),
      })),
    );
    // Score now rather than via the queue, so the demo opens with results already there.
    const toScore = await this.prisma.job.findMany({ where: { userId: user.id, filteredOut: null }, select: { id: true } });
    for (const { id } of toScore) await this.jobs.score(id);

    return { id: user.id, email: user.email, name: user.name, isDemo: true };
  }
}
