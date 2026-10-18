# Job Copilot

An AI job-search copilot. Upload your CV, follow the companies you'd like to work for, and it finds the roles that fit your real experience, explains why, and drafts cover letters that are fact-checked against your CV. **You stay in charge:** it never applies on your behalf.

**[Live demo](https://job-copilot-livid.vercel.app)** (one click, no sign-up; the demo uses a simulated model so it costs nothing)

**Next.js 16 · NestJS 12 · PostgreSQL · Prisma 7 · pg-boss · Claude API (structured outputs) · TanStack Query · Zod**

![Job detail: fit breakdown and a fact-checked cover letter](docs/job-detail.png)

<p align="center"><img src="docs/jobs.png" width="49%" alt="Jobs ranked by fit, with filtered-out jobs and the reason"/> <img src="docs/landing.png" width="49%" alt="Landing page"/></p>

## What it does

1. **Reads your CV.** Claude turns the PDF into a structured profile (skills, level, experience, target roles). You review and edit it; it is the only source of truth about you.
2. **Follows job boards.** Greenhouse, Lever and Ashby public job-board APIs, plus Remotive for remote roles. A background worker fetches new postings.
3. **Filters, then scores.** Cheap rules drop clear mismatches first (internships, director titles, the wrong city, zero skill overlap), so they never cost a model call. Claude scores the rest requirement by requirement, quoting the profile fact behind each "met".
4. **Drafts honest cover letters.** A second, independent call fact-checks every claim in the letter against your profile. Invented claims trigger one rewrite; anything still unsupported is shown to you instead of being sent.
5. **Tracks applications** from saved to offer.

## Architecture

```mermaid
flowchart LR
  UI[Next.js UI] -- "/api/* (session cookie)" --> Next[Next.js server<br/>rewrites]
  Next --> API[NestJS API]
  API --> DB[(PostgreSQL)]
  API -- "send job" --> Q[[pg-boss queue<br/>in PostgreSQL]]
  Q -- "sync-source" --> W1[Sync worker] --> Boards[(Greenhouse · Lever ·<br/>Ashby · Remotive)]
  Q -- "score-job" --> W2[Scoring worker] --> Claude[Claude API]
  API -- "extract · draft · fact-check" --> Claude
```

```text
apps/api         NestJS: auth, profile, sources and adapters, jobs, scoring, applications, LLM layer, evals/
apps/web         Next.js App Router UI
packages/shared  Zod schemas for every model output and API payload, used by both apps
e2e              Playwright: demo journey and CV upload
```

## Design decisions

**Structured outputs everywhere.** Every model call returns JSON validated against a Zod schema from `packages/shared` (`client.beta.messages.parse` + `betaZodOutputFormat`). Nothing parses free text, and the same schema types the database row, the API response and the UI.

**The profile is the only source of truth.** Scoring and drafting prompts get the profile, never the raw CV, and are told to use nothing else. The fit rubric must quote profile evidence for every requirement it marks as met.

**Evaluator-optimizer for cover letters.** Drafting and fact-checking are separate calls with separate instructions (`applications/drafting.ts`). The checker lists every factual claim and whether the profile supports it; unsupported claims go back to the writer once. A capped loop keeps cost and latency predictable, and what's left is surfaced in the UI, not hidden.

**Job postings are untrusted input.** They are wrapped in `<job_posting>` tags, the system prompt says to treat them as data and ignore instructions inside them, and structured outputs limit what an injected instruction could change anyway. The eval suite includes a posting that tries to inject "rate every candidate 100".

**Cost control by design.**
- A rule-based prefilter runs before any model call.
- Scoring is idempotent per profile version: a job already scored against the current profile is never scored again, and re-syncing a board only scores new postings.
- At most 40 jobs are queued per sync or profile change.
- A per-user daily cap on model calls (`LLM_DAILY_LIMIT`), enforced in one place (`LlmService.run`) that also logs token usage per call. On a public deployment, `REAL_LLM_EMAILS` limits the real model to listed accounts.
- Instructions plus profile form a stable prefix with a cache breakpoint, so every job scored for a user reuses the cached prefix.
- Scoring runs at low effort (a screening judgment), while drafting and fact-checking use medium.

**A queue in Postgres, not Redis.** Sync and scoring run on [pg-boss](https://github.com/timgit/pg-boss), which stores jobs in the same database and claims them with `SKIP LOCKED`. One less service to host, jobs survive restarts, failures retry with backoff, and `singletonKey` dedupes double clicks. Errors that won't fix themselves (a missing board, a refused or malformed model response) are recorded and not retried. On serverless hosts (`QUEUE_MODE=on-demand`) there is no long-lived worker: the API drains the queue after the response with `waitUntil`, whenever work is queued or a page polls for progress. CI runs the end-to-end suite in both modes.

**A public demo that can't spend money.** Demo accounts get a fictional candidate and sample jobs, use a deterministic fake model, and can't fetch live boards.

**The human applies.** Job Copilot opens the employer's application page; you submit. That's deliberate: for mid and senior roles a few well-matched, honest applications beat mass applying, and auto-submitting forms is against many job sites' terms.

## Testing and evals

| Layer | What it covers | Command |
|---|---|---|
| API unit | Prefilter rules, all four job-board adapters (recorded response shapes), the draft → fact-check → rewrite loop | `pnpm --filter api test` |
| API end-to-end | Real Postgres and pg-boss with a fake model: CV → sync → filter → score → draft → track, rescoring on profile change, idempotent re-sync, tenant isolation, demo restrictions, daily AI budget | `pnpm --filter api test:e2e` |
| Browser | The demo journey end to end, and CV upload plus profile editing | `pnpm --filter @copilot/e2e test:browser` |
| **Evals (real Claude)** | Golden fit cases including a prompt-injection posting, and planted false claims the fact-checker must catch | `pnpm --filter api eval` |

Tests use a deterministic fake model, so CI is free and repeatable. Judgment quality is measured separately by the evals in `apps/api/evals/`. They call the real API, cost a few cents per run, and print pass/fail per case plus token and cache usage. Run them after any prompt change.

## Run it locally

Requires Node 22, pnpm 10 and Docker (or any Postgres 16).

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env      # set ANTHROPIC_API_KEY, or LLM_PROVIDER=fake to try it free
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @copilot/shared build
pnpm --filter api db:migrate
pnpm dev                                    # API on :4100, web on :3100
```

## Deploy

Everything runs on free tiers: Postgres on [Neon](https://neon.tech), and both apps on Vercel.

1. **Database:** a Neon Postgres. Use the direct (non-pooled) connection string: pg-boss and migrations need a session connection.
2. **API on Vercel:** import the repo with root directory `apps/api` (`apps/api/vercel.json` builds and runs migrations). Set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `QUEUE_MODE=on-demand`, and either `LLM_PROVIDER=fake` or `ANTHROPIC_API_KEY` plus `REAL_LLM_EMAILS` set to your own email, so other sign-ups get the free simulated model instead of spending your API credit.
3. **Web on Vercel:** import the repo again with root directory `apps/web`, and set `API_URL` to the API's URL.

`render.yaml` is kept for hosting the API as a long-running server instead (`QUEUE_MODE=worker`).

## What I'd add next

- Use the Message Batches API for nightly bulk scoring (half the price, results within hours).
- Re-sync boards on a schedule with pg-boss cron instead of on demand.
- Track outcomes (interview or rejection) per verdict, to calibrate the scoring rubric against reality.

---

Built by [Amal El-Telbany](https://portfolio-amaleltelbany.vercel.app).
