"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationStatuses, type ApplicationDto, type JobDetailDto } from "@copilot/shared";
import { Button } from "@/components/ui";
import { copilotApi, keys } from "../app/api";
import { ScoreRing } from "./score-ring";
import { VerdictBadge } from "./verdict-badge";

export function JobDetail({ jobId }: { jobId: string }) {
  const job = useQuery({ queryKey: keys.job(jobId), queryFn: () => copilotApi.job(jobId) });

  if (job.isPending) return <p className="text-sm text-muted">Loading job…</p>;
  if (job.isError) return <p className="text-sm text-danger">{job.error.message}</p>;
  const j = job.data;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <article>
        <Link href="/app/jobs" className="text-sm text-muted hover:text-foreground">← Jobs</Link>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight">{j.title}</h1>
        <p className="mt-1 text-muted">
          {j.company} · {j.location || "Location not given"}{j.remote && !/remote/i.test(j.location) ? " · Remote" : ""}
        </p>
        <a href={j.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent hover:underline">
          View the original posting ↗
        </a>
        <h2 className="mb-3 mt-10 font-display text-2xl font-medium">About the role</h2>
        <p className="whitespace-pre-line leading-relaxed text-muted">{j.description || "No description provided."}</p>
      </article>

      <aside className="flex flex-col gap-6">
        <MatchPanel job={j} />
        <ApplicationPanel job={j} />
      </aside>
    </div>
  );
}

function MatchPanel({ job }: { job: JobDetailDto }) {
  if (job.filteredOut) {
    return <Panel title="Fit">Skipped before scoring: {job.filteredOut}.</Panel>;
  }
  if (!job.match) return <Panel title="Fit">Scoring this job against your profile…</Panel>;
  const m = job.match;
  return (
    <Panel title="Fit">
      <div className="flex items-center gap-4">
        <ScoreRing score={m.score} verdict={m.verdict} size="lg" />
        <div className="flex flex-col items-start gap-1.5">
          <VerdictBadge verdict={m.verdict} />
          <span className="text-xs text-muted">Role level: {m.roleSeniority}</span>
        </div>
      </div>
      <p className="mt-3 text-sm">{m.summary}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {m.requirements.map((r) => (
          <li key={r.requirement} className="text-sm">
            <span
              aria-hidden
              className={`me-2 inline-grid size-5 place-items-center rounded-full align-middle text-[11px] font-bold ${r.met === "yes" ? "bg-accent-soft text-accent" : r.met === "partly" ? "bg-gold-soft text-gold" : "bg-surface-muted text-muted"}`}
            >
              {r.met === "yes" ? "✓" : r.met === "partly" ? "◐" : "✕"}
            </span>
            <span className={r.mustHave ? "font-medium" : ""}>{r.requirement}</span>
            {r.mustHave && <span className="ms-1 text-xs text-muted">(must-have)</span>}
            {r.evidence && <span className="block ps-7 font-display text-[13px] italic text-muted">&ldquo;{r.evidence}&rdquo;</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ApplicationPanel({ job }: { job: JobDetailDto }) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.job(job.id) });
    void queryClient.invalidateQueries({ queryKey: keys.allJobs });
    void queryClient.invalidateQueries({ queryKey: keys.applications });
    void queryClient.invalidateQueries({ queryKey: keys.dashboard });
  };
  const start = useMutation({ mutationFn: () => copilotApi.startApplication(job.id), onSuccess: refresh });
  const app = job.application;

  if (!app) {
    return (
      <Panel title="Application">
        <p className="text-sm text-muted">Start tracking this job and get a cover letter drafted from your profile.</p>
        <Button className="mt-3 w-full" onClick={() => start.mutate()} disabled={start.isPending}>Start application</Button>
        {start.isError && <p className="mt-2 text-sm text-danger">{start.error.message}</p>}
      </Panel>
    );
  }
  return <ApplicationEditor key={`${app.id}:${app.draftAttempts}`} app={app} applyUrl={job.applyUrl} onChange={refresh} />;
}

function ApplicationEditor({ app, applyUrl, onChange }: { app: ApplicationDto; applyUrl: string; onChange: () => void }) {
  // Remounted (via key) after each new draft, so the textarea starts from the latest letter.
  const [letter, setLetter] = useState(app.coverLetter);

  const draft = useMutation({ mutationFn: () => copilotApi.draft(app.id), onSuccess: onChange });
  const update = useMutation({
    mutationFn: (input: Parameters<typeof copilotApi.updateApplication>[1]) => copilotApi.updateApplication(app.id, input),
    onSuccess: onChange,
  });
  const dirty = letter !== app.coverLetter;

  return (
    <Panel title="Application">
      <label className="flex items-center justify-between gap-2 text-sm">
        Status
        <select
          value={app.status}
          onChange={(e) => update.mutate({ status: e.target.value as ApplicationDto["status"] })}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        >
          {applicationStatuses.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </label>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Cover letter</h3>
        <Button variant="secondary" onClick={() => draft.mutate()} disabled={draft.isPending}>
          {draft.isPending ? "Drafting and fact-checking…" : app.coverLetter ? "Redraft" : "Draft with AI"}
        </Button>
      </div>
      {draft.isError && <p className="mt-2 text-sm text-danger">{draft.error.message}</p>}

      {app.unsupportedClaims.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-gold/40 bg-gold-soft p-3 text-sm">
          <p className="font-medium">Check these before sending: your profile doesn&apos;t back them up.</p>
          <ul className="mt-1 list-disc ps-5">
            {app.unsupportedClaims.map((c) => <li key={c.claim}>{c.claim}</li>)}
          </ul>
        </div>
      )}
      {app.coverLetter && app.unsupportedClaims.length === 0 && (
        <p className="mt-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs text-accent">✓ Every claim was checked against your profile.</p>
      )}

      <textarea
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        rows={12}
        placeholder="Draft a letter, or write your own."
        aria-label="Cover letter"
        className="mt-3 w-full rounded-md border border-border bg-background px-3.5 py-3 font-display text-[15px] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" disabled={!dirty || update.isPending} onClick={() => update.mutate({ coverLetter: letter })}>
          Save edits
        </Button>
        <Button variant="ghost" onClick={() => navigator.clipboard.writeText(letter)} disabled={!letter}>Copy</Button>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
        <a href={applyUrl} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground hover:brightness-110">
          Open the application page ↗
        </a>
        {app.status !== "APPLIED" && (
          <Button variant="secondary" onClick={() => update.mutate({ status: "APPLIED" })}>I&apos;ve applied</Button>
        )}
        <p className="text-xs text-muted">You submit every application yourself. Job Copilot never applies on your behalf.</p>
      </div>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm" aria-label={title}>
      <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}
