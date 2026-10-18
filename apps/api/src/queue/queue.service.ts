import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

/**
 * Background work runs on pg-boss: a job queue stored in the same Postgres database,
 * so there is no Redis to host. Jobs survive restarts, retry with backoff, and
 * workers claim them with SKIP LOCKED, so running several API instances is safe.
 */
@Injectable()
export class QueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(QueueService.name);
  private readonly boss: PgBoss;
  private readonly handlers = new Map<string, { handler: Handler<never>; concurrency: number }>();
  private started = false;

  constructor(config: ConfigService<Env, true>) {
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
  }

  async onApplicationShutdown() {
    if (this.started) await this.boss.stop({ graceful: true, timeout: 10_000 });
  }
}
