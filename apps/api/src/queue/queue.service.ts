import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { waitUntil } from '@vercel/functions';
import { PgBoss } from 'pg-boss';
import type { Env } from '../config/env.js';

export const Queues = {
  syncSource: 'sync-source',
  scoreJob: 'score-job',
} as const;

export interface SyncSourceJob {
  sourceId: string;
}

export interface ScoreJobJob {
  jobId: string;
}

type Handler<T> = (data: T) => Promise<void>;

/** Stop draining before the platform's function time limit (300s) cuts us off mid-job. */
const DRAIN_BUDGET_MS = 240_000;

/**
 * Background work runs on pg-boss: a job queue stored in the same Postgres database,
 * so there is no Redis to host. Jobs survive restarts, retry with backoff, and
 * workers claim them with SKIP LOCKED, so running several API instances is safe.
 *
 * In on-demand mode (serverless) there is no poller: `kick()` drains the queues after the
 * response is sent. A job cut off mid-run expires and is retried by the next drain.
 */
@Injectable()
export class QueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(QueueService.name);
  private readonly boss: PgBoss;
  private readonly handlers = new Map<string, { handler: Handler<never>; concurrency: number }>();
  private readonly onDemand: boolean;
  private started = false;
  private draining: Promise<void> | null = null;

  constructor(config: ConfigService<Env, true>) {
    this.onDemand = config.get('QUEUE_MODE') === 'on-demand';
    this.boss = new PgBoss(config.get('DATABASE_URL'));
    this.boss.on('error', (error) => this.logger.error(error));
  }

  /** Register a worker before startup; services call this from their constructors. */
  register<T>(queue: string, handler: Handler<T>, concurrency = 1) {
    this.handlers.set(queue, { handler: handler as Handler<never>, concurrency });
  }

  async onModuleInit() {
    await this.boss.start();
    this.started = true;
    for (const name of Object.values(Queues)) {
      await this.boss.createQueue(name, {
        // Model calls fail transiently (rate limits, overload); a few spaced-out retries usually get through.
        retryLimit: 3,
        retryDelay: 15,
        retryBackoff: true,
        expireInSeconds: 300,
      });
    }
    if (this.onDemand) return;
    for (const [queue, { handler, concurrency }] of this.handlers) {
      for (let i = 0; i < concurrency; i++) {
        await this.boss.work<object>(queue, async ([job]) => {
          await handler(job.data as never);
        });
      }
    }
  }

  async send<T extends object>(queue: string, data: T, singletonKey?: string) {
    // singletonKey dedupes: clicking "sync" twice, or rescoring a job already waiting, queues it once.
    await this.boss.send(queue, data, singletonKey ? { singletonKey } : {});
    this.kick();
  }

  /** On-demand mode: start draining in the background if this instance isn't already. */
  kick() {
    if (!this.onDemand || this.draining) return;
    this.draining = this.drain().finally(() => (this.draining = null));
    // Keeps the serverless function alive after the response until the drain finishes.
    waitUntil(this.draining);
  }

  private async drain() {
    const deadline = Date.now() + DRAIN_BUDGET_MS;
    let ranAny = true;
    while (ranAny && Date.now() < deadline) {
      ranAny = false;
      for (const [queue, { handler, concurrency }] of this.handlers) {
        const jobs = await this.boss.fetch<object>(queue, { batchSize: concurrency });
        if (jobs.length > 0) ranAny = true;
        await Promise.all(
          jobs.map(async (job) => {
            try {
              await handler(job.data as never);
              await this.boss.complete(queue, job.id);
            } catch (error) {
              this.logger.warn(`${queue} job ${job.id} failed: ${String(error)}`);
              await this.boss.fail(queue, job.id, { message: String(error) });
            }
          }),
        );
      }
    }
  }

  async onApplicationShutdown() {
    await this.draining;
    if (this.started) await this.boss.stop({ graceful: true, timeout: 10_000 });
  }
}
