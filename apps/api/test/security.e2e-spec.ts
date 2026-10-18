import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { boardPostings, createTestApp, eventually, FAKE_PDF, posting, resetDatabase, signUp, type App } from './helpers.js';

describe('tenancy, demo accounts and the AI budget', () => {
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

  it('requires a session', async () => {
    await request(app.getHttpServer()).get('/api/jobs').expect(401);
  });

  it("never shows one user's jobs or applications to another", async () => {
    const owner = await signUp(app, 'Owner');
    const other = await signUp(app, 'Other');
    await owner.agent.post('/api/profile/cv').attach('cv', FAKE_PDF, 'cv.pdf').expect(201);
    boardPostings.set('acme', [posting('1', 'Backend Engineer', 'TypeScript')]);
    await owner.agent.post('/api/sources').send({ kind: 'GREENHOUSE', identifier: 'acme', label: 'Acme' }).expect(201);
    const job = await eventually(() => prisma.job.findFirst(), (j) => j !== null);
    const { body: application } = await owner.agent.post(`/api/jobs/${job!.id}/application`).expect(201);

    await other.agent.get(`/api/jobs/${job!.id}`).expect(404);
    await other.agent.post(`/api/jobs/${job!.id}/application`).expect(404);
    await other.agent.patch(`/api/applications/${application.id}`).send({ status: 'REJECTED' }).expect(404);
    expect((await other.agent.get('/api/jobs').expect(200)).body).toEqual([]);
    expect((await other.agent.get('/api/applications').expect(200)).body).toEqual([]);
  });

  it('gives demo accounts sample data but no access to live boards', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/demo').expect(201);
    const { body: jobs } = await agent.get('/api/jobs').expect(200);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((j: { match: unknown }) => j.match !== null)).toBe(true);
    await agent.post('/api/sources').send({ kind: 'GREENHOUSE', identifier: 'acme', label: 'Acme' }).expect(403);
  });

  it('stops model calls once the daily budget is used up', async () => {
    const { agent, user } = await signUp(app);
    const limit = Number(process.env.LLM_DAILY_LIMIT ?? 150);
    await prisma.llmCall.createMany({
      data: Array.from({ length: limit }, () => ({ userId: user.id, purpose: 'assess-fit', model: 'fake', inputTokens: 0, outputTokens: 0 })),
    });
    const res = await agent.post('/api/profile/cv').attach('cv', FAKE_PDF, 'cv.pdf').expect(429);
    expect(res.body.message).toMatch(/Daily AI limit/);
    expect(await prisma.profile.count()).toBe(0);
  });
});
