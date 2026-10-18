import Anthropic from '@anthropic-ai/sdk';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClaudeProvider } from './claude.provider.js';
import { FakeProvider } from './fake.provider.js';
import type { LlmProvider, LlmResult } from './llm.types.js';

export type LlmPurpose = 'extract-profile' | 'assess-fit' | 'draft-letter' | 'check-claims';

/**
 * The only way the app reaches a model: picks the provider, enforces the per-user daily budget,
 * and records token usage for every call.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly real: LlmProvider;
  private readonly fake = new FakeProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.real =
      config.get('LLM_PROVIDER') === 'claude'
        ? // The SDK retries 429, 5xx and connection errors twice with backoff by default; we allow one more.
          new ClaudeProvider(new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY'), maxRetries: 3 }), config.get('CLAUDE_MODEL'))
        : this.fake;
  }

  /** Demo accounts always use the fake provider: a public demo must not be able to spend real money. */
  providerFor(user: { isDemo: boolean }): LlmProvider {
    return user.isDemo ? this.fake : this.real;
  }

  async run<T>(
    user: { id: string; isDemo: boolean },
    purpose: LlmPurpose,
    call: (provider: LlmProvider) => Promise<LlmResult<T>>,
  ): Promise<T> {
    await this.ensureBudget(user.id);
    const { value, usage } = await call(this.providerFor(user));
    await this.prisma.llmCall.create({
      data: {
        userId: user.id,
        purpose,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
      },
    });
    if (usage.cacheReadTokens > 0) {
      this.logger.debug(`${purpose}: ${usage.cacheReadTokens} input tokens served from cache`);
    }
    return value;
  }

  async callsToday(userId: string): Promise<number> {
    return this.prisma.llmCall.count({ where: { userId, createdAt: { gte: startOfUtcDay() } } });
  }

  dailyLimit(): number {
    return this.config.get('LLM_DAILY_LIMIT');
  }

  private async ensureBudget(userId: string) {
    if ((await this.callsToday(userId)) >= this.dailyLimit()) {
      throw new HttpException('Daily AI limit reached. It resets at midnight UTC.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
