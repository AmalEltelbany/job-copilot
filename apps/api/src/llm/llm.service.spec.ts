import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { LlmService } from './llm.service.js';

function serviceWith(realLlmEmails: string[]) {
  const values: Partial<Env> = {
    LLM_PROVIDER: 'claude',
    ANTHROPIC_API_KEY: 'sk-ant-test',
    CLAUDE_MODEL: 'claude-opus-5-5',
    LLM_DAILY_LIMIT: 150,
    REAL_LLM_EMAILS: realLlmEmails,
  };
  const config = { get: (key: keyof Env) => values[key] } as unknown as ConfigService<Env, true>;
  return new LlmService({} as PrismaService, config);
}

describe('LlmService provider choice', () => {
  it('never lets demo accounts use the real model', () => {
    expect(serviceWith([]).modelLabel({ isDemo: true, email: 'anyone@example.com' })).toBe('fake');
  });

  it('gives everyone the real model when no allowlist is set', () => {
    expect(serviceWith([]).modelLabel({ isDemo: false, email: 'anyone@example.com' })).toBe('claude-opus-5-5');
  });

  it('gives only allow-listed emails the real model, ignoring case', () => {
    const llm = serviceWith(['owner@example.com']);
    expect(llm.modelLabel({ isDemo: false, email: 'Owner@Example.com' })).toBe('claude-opus-5-5');
    expect(llm.modelLabel({ isDemo: false, email: 'stranger@example.com' })).toBe('fake');
  });
});
