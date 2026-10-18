import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { candidateProfileSchema, type CandidateProfile, type JobDetailDto, type JobListQuery, type JobSummaryDto } from '@copilot/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { LlmService } from '../llm/llm.service.js';
import { LlmOutputError } from '../llm/llm.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueueService, Queues, type ScoreJobJob } from '../queue/queue.service.js';
import type { NormalizedJob } from '../sources/adapters/types.js';
import { toJobDetailDto, toJobSummaryDto } from './mappers.js';
import { prefilter } from './prefilter.js';

/** At most this many jobs get scored per sync or profile change: a ceiling on what one click can cost. */
export const SCORE_CAP = 40;

const withRelations = { source: true, match: true, application: true } as const;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly queue: QueueService,
  ) {
    // Model calls are the slow, rate-limited part, so a few run in parallel.
    queue.register<ScoreJobJob>(Queues.scoreJob, (data) => this.score(data.jobId), 3);
  }

  async list(userId: string, query: JobListQuery): Promise<JobSummaryDto[]> {
    const where: Prisma.JobWhereInput = {
      userId,
      ...(query.includeFiltered ? {} : { filteredOut: null }),
      ...(query.verdict ? { match: { verdict: query.verdict } } : {}),
      ...(query.q
        ? { OR: [{ title: { contains: query.q, mode: 'insensitive' } }, { company: { contains: query.q, mode: 'insensitive' } }] }
        : {}),
    };
    const jobs = await this.prisma.job.findMany({
      where,
      include: withRelations,
      orderBy: { postedAt: { sort: 'desc', nulls: 'last' } },
      take: 200,
    });
    // Best matches first, unscored last. Done in memory: Prisma can't sort nulls-last across a relation.
    return jobs
      .map(toJobSummaryDto)
      .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));
  }

  async detail(userId: string, jobId: string): Promise<JobDetailDto> {
    return toJobDetailDto(await this.owned(userId, jobId));
  }

  async owned(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: withRelations });
    if (!job || job.userId !== userId) throw new NotFoundException('Job not found');
    return job;
  }

  /** Insert postings we haven't seen; existing ones keep their scores and applications. */
  async storeFetchedJobs(userId: string, sourceId: string, fetched: NormalizedJob[]) {
    const profile = await this.loadProfile(userId);
    const known = new Set(
      (await this.prisma.job.findMany({ where: { sourceId }, select: { externalId: true } })).map((j) => j.externalId),
    );
    const fresh = fetched.filter((job) => !known.has(job.externalId));
    if (fresh.length === 0) return;

    await this.prisma.job.createMany({
      data: fresh.map((job) => ({
        ...job,
        userId,
        sourceId,
        // Without a profile we can't filter yet; reassessAll runs once the CV is uploaded.
        filteredOut: profile ? prefilter(profile.data, job) : null,
      })),
      skipDuplicates: true,
    });
    if (profile) await this.queueScoring(userId);
  }

  /** After a profile change: re-run the filter on every job and rescore the ones that pass. */
  async reassessAll(userId: string, profile: CandidateProfile) {
    const jobs = await this.prisma.job.findMany({ where: { userId } });
    for (const job of jobs) {
      const reason = prefilter(profile, job);
      if (reason !== job.filteredOut) {
        await this.prisma.job.update({ where: { id: job.id }, data: { filteredOut: reason } });
      }
    }
    await this.queueScoring(userId);
  }

  private async queueScoring(userId: string) {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    const toScore = await this.prisma.job.findMany({
      where: {
        userId,
        filteredOut: null,
        OR: [{ match: null }, { match: { profileVersion: { lt: profile.version } } }],
      },
      orderBy: { postedAt: { sort: 'desc', nulls: 'last' } },
      take: SCORE_CAP,
      select: { id: true },
    });
    for (const { id } of toScore) {
      await this.queue.send<ScoreJobJob>(Queues.scoreJob, { jobId: id }, `score:${id}:v${profile.version}`);
    }
  }

  /** Runs on the queue. Idempotent: a job already scored against this profile version is skipped. */
  async score(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: { match: true, user: true } });
    if (!job || job.filteredOut) return;
    const profile = await this.loadProfile(job.userId);
    if (!profile || (job.match && job.match.profileVersion >= profile.version)) return;

    let fit;
    try {
      fit = await this.llm.run(job.user, 'assess-fit', (p) => p.assessFit(profile.data, job));
    } catch (error) {
      // A refusal or malformed output won't change on retry; anything else (rate limits, outages) should retry.
      if (error instanceof LlmOutputError) {
        this.logger.warn(`Could not score job ${jobId}: ${error.message}`);
        return;
      }
      throw error;
    }

    const data = {
      userId: job.userId,
      profileVersion: profile.version,
      score: fit.score,
      verdict: fit.verdict,
      summary: fit.summary,
      roleSeniority: fit.roleSeniority,
      requirements: fit.requirements,
      model: this.llm.modelLabel(job.user),
    };
    await this.prisma.match.upsert({ where: { jobId }, create: { jobId, ...data }, update: data });
  }

  async loadProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    return profile ? { version: profile.version, data: candidateProfileSchema.parse(profile.data) } : null;
  }
}
