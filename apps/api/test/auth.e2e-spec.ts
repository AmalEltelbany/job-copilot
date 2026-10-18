import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase, signUp, type App } from './helpers.js';

describe('auth', () => {
  let app: App;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => app.close());

  it('keeps the session in an httpOnly cookie', async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent
      .post('/api/auth/register')
      .send({ email: 'Amal@Example.com', name: 'Amal', password: 'correct horse battery' })
      .expect(201);
    expect(res.headers['set-cookie']?.[0]).toMatch(/copilot_session=.*HttpOnly/i);
    await agent.get('/api/auth/me').expect(200).expect((r) => expect(r.body).toMatchObject({ email: 'amal@example.com', isDemo: false }));
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { user } = await signUp(app);
    const a = await request(app.getHttpServer()).post('/api/auth/login').send({ email: user.email, password: 'wrong-pass' }).expect(401);
    const b = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'x@example.com', password: 'wrong-pass' }).expect(401);
    expect(a.body.message).toBe(b.body.message);
  });
});
