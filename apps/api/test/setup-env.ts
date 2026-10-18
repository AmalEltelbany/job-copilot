// e2e tests run against a real Postgres (see README / CI), with the deterministic fake model.
process.env.DATABASE_URL ??= 'postgresql://copilot:copilot@localhost:5432/copilot_test?schema=public';
process.env.JWT_SECRET ??= 'test-secret-at-least-16-chars';
process.env.LLM_PROVIDER = 'fake';
process.env.NODE_ENV = 'test';
