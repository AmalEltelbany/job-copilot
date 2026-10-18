import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SOURCE_ADAPTERS, type SourceAdapters } from '../src/sources/adapters/index.js';
import type { NormalizedJob } from '../src/sources/adapters/types.js';

export type App = INestApplication<Server>;

/** Job boards are external; tests serve these postings instead. Keyed by board identifier. */
export const boardPostings = new Map<string, NormalizedJob[]>();

const stubAdapter = (kind: keyof SourceAdapters) => ({
  kind,
  fetchJobs: async (identifier: string) => {
    const jobs = boardPostings.get(identifier);
    if (!jobs) throw new (await import('../src/sources/adapters/types.js')).SourceFetchError('Board not found.');
    return jobs;
  },
});

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SOURCE_ADAPTERS)
    .useValue({
      GREENHOUSE: stubAdapter('GREENHOUSE'),
      LEVER: stubAdapter('LEVER'),
      ASHBY: stubAdapter('ASHBY'),
      REMOTIVE: stubAdapter('REMOTIVE'),
    } satisfies SourceAdapters)
    .compile();
  const app = moduleRef.createNestApplication<App>();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "LlmCall", "Application", "Match", "Job", "JobSource", "Profile", "User" CASCADE',
  );
}

let counter = 0;

export async function signUp(app: App, name = 'User') {
  counter += 1;
  const agent = request.agent(app.getHttpServer());
  const res = await agent
    .post('/api/auth/register')
    .send({ email: `${name.toLowerCase()}-${counter}@example.com`, name, password: 'correct horse battery' })
    .expect(201);
  return { agent, user: res.body as { id: string; email: string } };
}

/** Smallest thing that passes the PDF magic-byte check; the fake model ignores the contents. */
export const FAKE_PDF = Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF');

/** Background jobs finish asynchronously; poll until the condition holds. */
export async function eventually<T>(read: () => Promise<T>, done: (value: T) => boolean, timeoutMs = 20_000): Promise<T> {
  const started = Date.now();
  for (;;) {
    const value = await read();
    if (done(value)) return value;
    if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting; last value: ${JSON.stringify(value)}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

export function posting(id: string, title: string, description: string, overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    externalId: id,
    title,
    company: 'Acme',
    location: 'Cairo, Egypt',
    remote: false,
    url: `https://example.com/${id}`,
    applyUrl: `https://example.com/${id}/apply`,
    description,
    postedAt: new Date('2026-10-01'),
    ...overrides,
  };
}
