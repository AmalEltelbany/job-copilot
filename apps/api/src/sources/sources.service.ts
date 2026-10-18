import { ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CreateSourceInput, SourceDto } from '@copilot/shared';
import type { AuthUser } from '../common/request-context.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { QueueService, Queues, type SyncSourceJob } from '../queue/queue.service.js';
import { SOURCE_ADAPTERS, type SourceAdapters } from './adapters/index.js';
import { SourceFetchError } from './adapters/types.js';

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly jobs: JobsService,
    @Inject(SOURCE_ADAPTERS) private readonly adapters: SourceAdapters,
  ) {
    queue.register<SyncSourceJob>(Queues.syncSource, (data) => this.sync(data.sourceId));
  }

  async list(userId: string): Promise<SourceDto[]> {
    this.queue.kick();
    const sources = await this.prisma.jobSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { jobs: true } } },
    });
    return sources.map((s) => ({
      id: s.id,
      kind: s.kind,
      identifier: s.identifier,
      label: s.label,
      lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
      lastError: s.lastError,
      jobCount: s._count.jobs,
    }));
  }

  async create(user: AuthUser, input: CreateSourceInput) {
    assertNotDemo(user);
    const userId = user.id;
    const exists = await this.prisma.jobSource.findUnique({
      where: { userId_kind_identifier: { userId, kind: input.kind, identifier: input.identifier } },
    });
    if (exists) throw new ConflictException('You already follow this board');
    const source = await this.prisma.jobSource.create({ data: { userId, ...input } });
    await this.requestSync(user, source.id);
    return source;
  }

  async remove(userId: string, sourceId: string) {
    await this.owned(userId, sourceId);
    await this.prisma.jobSource.delete({ where: { id: sourceId } });
  }

  async requestSync(user: AuthUser, sourceId: string) {
    assertNotDemo(user);
    await this.owned(user.id, sourceId);
    await this.queue.send<SyncSourceJob>(Queues.syncSource, { sourceId }, `sync:${sourceId}`);
  }

  /** Runs on the queue: fetch the board, store new postings, and queue the ones worth scoring. */
  async sync(sourceId: string) {
    const source = await this.prisma.jobSource.findUnique({ where: { id: sourceId } });
    if (!source) return; // deleted while queued

    let fetched;
    try {
      fetched = await this.adapters[source.kind].fetchJobs(source.identifier, source.label);
    } catch (error) {
      const message = error instanceof SourceFetchError ? error.message : 'Could not read this job board';
      this.logger.warn(`Sync ${source.kind}/${source.identifier} failed: ${String(error)}`);
      await this.prisma.jobSource.update({ where: { id: sourceId }, data: { lastError: message } });
      // A missing board won't appear on retry; network errors might, so let the queue retry those.
      if (error instanceof SourceFetchError) return;
      throw error;
    }

    await this.jobs.storeFetchedJobs(source.userId, source.id, fetched);
    await this.prisma.jobSource.update({ where: { id: sourceId }, data: { lastSyncedAt: new Date(), lastError: null } });
  }

  private async owned(userId: string, sourceId: string) {
    const source = await this.prisma.jobSource.findUnique({ where: { id: sourceId } });
    if (!source || source.userId !== userId) throw new NotFoundException('Source not found');
    return source;
  }
}

/** Demo accounts are shared-looking sandboxes; they don't fetch live boards (or call the paid model). */
function assertNotDemo(user: AuthUser) {
  if (user.isDemo) throw new ForbiddenException('The demo uses sample jobs. Create a free account to follow real job boards.');
}
