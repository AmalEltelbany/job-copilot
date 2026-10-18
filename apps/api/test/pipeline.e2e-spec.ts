import type { JobSummaryDto } from '@copilot/shared';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { boardPostings, createTestApp, eventually, FAKE_PDF, posting, resetDatabase, signUp, type App } from './helpers.js';

describe('CV → job board → scored matches → application', () => {
  let app: App;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    boardPostings.clear();
  });
  afterAll(() => app.close());

  it('rejects uploads that are not PDFs', async () => {
    const { agent } = await signUp(app);
    await agent.post('/api/profile/cv').attach('cv', Buffer.from('hello'), 'cv.pdf').expect(400);
    await agent.post('/api/profile/cv').expect(400);
  });

  it('runs the whole pipeline: extract, sync, filter, score, draft, track', async () => {
    const { agent } = await signUp(app, 'Sara');

    const { body: profile } = await agent.post('/api/profile/cv').attach('cv', FAKE_PDF, 'sara.pdf').expect(201);
    expect(profile).toMatchObject({ version: 1, sourceFileName: 'sara.pdf', data: { seniority: 'mid' } });

    boardPostings.set('acme', [
      posting('1', 'Full-Stack Engineer', 'TypeScript, React, NestJS, PostgreSQL and Docker.'),
      posting('2', 'Backend Engineer', 'Node.js services.'),
      posting('3', 'Software Engineering Intern', 'Summer internship.'),
      posting('4', 'Platform Engineer', 'Go and Kafka only.', { location: 'Berlin, Germany' }),
    ]);
    await agent.post('/api/sources').send({ kind: 'GREENHOUSE', identifier: 'acme', label: 'Acme' }).expect(201);

    // Sync and scoring happen on the queue.
    const jobs = await eventually(
      async () => (await agent.get('/api/jobs').expect(200)).body as JobSummaryDto[],
      (list) => list.length === 2 && list.every((j) => j.match !== null),
    );
    expect(jobs.map((j) => j.title)).toEqual(['Full-Stack Engineer', 'Backend Engineer']); // best score first
    expect(jobs[0].match!.score).toBeGreaterThan(jobs[1].match!.score);

    const { body: all } = await agent.get('/api/jobs?includeFiltered=true').expect(200);
    expect(Object.fromEntries(all.map((j: JobSummaryDto) => [j.title, j.filteredOut]))).toMatchObject({
      'Software Engineering Intern': 'Internship or graduate role',
      'Platform Engineer': 'Location: Berlin, Germany',
    });
    // "false" in a query string must mean false.
    expect((await agent.get('/api/jobs?includeFiltered=false').expect(200)).body).toHaveLength(2);

    const { body: application } = await agent.post(`/api/jobs/${jobs[0].id}/application`).expect(201);
    const { body: drafted } = await agent.post(`/api/applications/${application.id}/draft`).expect(200);
    expect(drafted.status).toBe('DRAFTED');
    expect(drafted.coverLetter).toContain('Full-Stack Engineer');
    expect(drafted.unsupportedClaims).toEqual([]);

    const { body: applied } = await agent.patch(`/api/applications/${application.id}`).send({ status: 'APPLIED' }).expect(200);
    expect(applied.appliedAt).not.toBeNull();

    const { body: dashboard } = await agent.get('/api/dashboard').expect(200);
    expect(dashboard).toMatchObject({ hasProfile: true, sources: 1, jobs: 2, scored: 2, applications: { APPLIED: 1 } });
  });

  it('only scores each job once per profile version, and rescores after the profile changes', async () => {
    const { agent } = await signUp(app);
    const { body: profile } = await agent.post('/api/profile/cv').attach('cv', FAKE_PDF, 'cv.pdf').expect(201);
    boardPostings.set('acme', [posting('1', 'Backend Engineer', 'TypeScript and PostgreSQL')]);
    await agent.post('/api/sources').send({ kind: 'LEVER', identifier: 'acme', label: 'Acme' }).expect(201);
    await eventually(() => prisma.match.count(), (n) => n === 1);

    // Syncing again finds nothing new and makes no new model calls.
    const source = await prisma.jobSource.findFirstOrThrow();
    const callsBefore = await prisma.llmCall.count({ where: { purpose: 'assess-fit' } });
    await agent.post(`/api/sources/${source.id}/sync`).expect(202);
    await eventually(() => prisma.jobSource.findFirstOrThrow(), (s) => s.lastSyncedAt! > source.lastSyncedAt!);
    expect(await prisma.llmCall.count({ where: { purpose: 'assess-fit' } })).toBe(callsBefore);

    // A profile edit bumps the version, and the job is rescored against it.
    await agent.put('/api/profile').send({ ...profile.data, skills: ['TypeScript'] }).expect(200);
    const match = await eventually(() => prisma.match.findFirstOrThrow(), (m) => m.profileVersion === 2);
    expect(match.profileVersion).toBe(2);
  });

  it('records a clear error for a board that does not exist', async () => {
    const { agent } = await signUp(app);
    await agent.post('/api/sources').send({ kind: 'ASHBY', identifier: 'missing', label: 'Missing' }).expect(201);
    const [source] = await eventually(
      async () => (await agent.get('/api/sources').expect(200)).body,
      (list: { lastError: string | null }[]) => list[0]?.lastError !== null,
    );
    expect(source.lastError).toBe('Board not found.');
  });
});
