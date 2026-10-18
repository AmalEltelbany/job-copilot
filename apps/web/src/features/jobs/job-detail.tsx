"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationStatuses, type ApplicationDto, type JobDetailDto } from "@copilot/shared";
import { Button } from "@/components/ui";
import { copilotApi, keys } from "../app/api";
import { VerdictBadge } from "./verdict-badge";

export function JobDetail({ jobId }: { jobId: string }) {
  const job = useQuery({ queryKey: keys.job(jobId), queryFn: () => copilotApi.job(jobId) });

  if (job.isPending) return <p className="text-sm text-muted">Loading job…</p>;
  if (job.isError) return <p className="text-sm text-danger">{job.error.message}</p>;
  const j = job.data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <article>
        <Link href="/app/jobs" className="text-sm text-muted hover:text-foreground">← Jobs</Link>
        <h1 className="mt-3 text-2xl font-semibold">{j.title}</h1>
        <p className="mt-1 text-muted">
          {j.company} · {j.location || "Location not given"}{j.remote && !/remote/i.test(j.location) ? " · Remote" : ""}
        </p>
        <a href={j.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent hover:underline">
          View the original posting ↗
        </a>
        <h2 className="mb-2 mt-8 text-sm font-semibold">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{j.description || "No description provided."}</p>
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
      <div className="flex items-center gap-3">
        <VerdictBadge verdict={m.verdict} score={m.score} />
        <span className="text-xs text-muted">Role level: {m.roleSeniority}</span>
      </div>
      <p className="mt-3 text-sm">{m.summary}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {m.requirements.map((r) => (
          <li key={r.requirement} className="text-sm">
            <span className="me-1.5" aria-hidden>{r.met === "yes" ? "✅" : r.met === "partly" ? "🟡" : "❌"}</span>
            <span className={r.mustHave ? "font-medium" : ""}>{r.requirement}</span>
            {r.mustHave && <span className="ms-1 text-xs text-muted">(must-have)</span>}
            {r.evidence && <span className="block ps-6 text-xs text-muted">{r.evidence}</span>}
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
          className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
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
        <div role="alert" className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium">Check these before sending: your profile doesn&apos;t back them up.</p>
          <ul className="mt-1 list-disc ps-5">
            {app.unsupportedClaims.map((c) => <li key={c.claim}>{c.claim}</li>)}
          </ul>
        </div>
      )}
      {app.coverLetter && app.unsupportedClaims.length === 0 && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">✓ Every claim was checked against your profile.</p>
      )}

      <textarea
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        rows={12}
        placeholder="Draft a letter, or write your own."
        aria-label="Cover letter"
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
      />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" disabled={!dirty || update.isPending} onClick={() => update.mutate({ coverLetter: letter })}>
          Save edits
        </Button>
        <Button variant="ghost" onClick={() => navigator.clipboard.writeText(letter)} disabled={!letter}>Copy</Button>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
        <a href={applyUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-accent px-3.5 py-2 text-center text-sm font-medium text-accent-foreground hover:opacity-90">
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
    <section className="rounded-xl border border-border bg-surface p-4" aria-label={title}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
