"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { verdicts, type Verdict } from "@copilot/shared";
import { Input } from "@/components/ui";
import { PageHeader } from "../app/app-shell";
import { copilotApi, keys } from "../app/api";
import { VerdictBadge, verdictLabel } from "./verdict-badge";

export function JobList() {
  const [verdict, setVerdict] = useState<Verdict | undefined>();
  const [includeFiltered, setIncludeFiltered] = useState(false);
  const [q, setQ] = useState("");
  const filters = { verdict, includeFiltered, q: q.trim() || undefined };
  const jobs = useQuery({
    queryKey: keys.jobs(filters),
    queryFn: () => copilotApi.jobs(filters),
    refetchInterval: (query) => (query.state.data?.some((j) => !j.match && !j.filteredOut) ? 4000 : false),
  });

  return (
    <>
      <PageHeader title="Jobs" description="Best matches first. Jobs the filters ruled out are hidden unless you ask." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip active={!verdict} onClick={() => setVerdict(undefined)}>All</FilterChip>
        {verdicts.map((v) => (
          <FilterChip key={v} active={verdict === v} onClick={() => setVerdict(v)}>{verdictLabel[v]}</FilterChip>
        ))}
        <label className="ms-2 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={includeFiltered} onChange={(e) => setIncludeFiltered(e.target.checked)} />
          Show filtered out
        </label>
        <Input className="ms-auto max-w-56" placeholder="Search title or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search jobs" />
      </div>

      {jobs.isPending && <p className="text-sm text-muted">Loading jobs…</p>}
      {jobs.isError && <p className="text-sm text-danger">{jobs.error.message}</p>}
      {jobs.data?.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No jobs here yet. <Link href="/app/sources" className="text-accent hover:underline">Follow a job board</Link> to start.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {jobs.data?.map((job) => (
          <li key={job.id}>
            <Link href={`/app/jobs/${job.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{job.title}</p>
                <p className="truncate text-sm text-muted">
                  {job.company} · {job.location || "Location not given"}{job.remote && !/remote/i.test(job.location) ? " · Remote" : ""}
                </p>
              </div>
              {job.applicationStatus && <span className="text-xs text-muted">{job.applicationStatus.toLowerCase()}</span>}
              {job.match ? (
                <VerdictBadge verdict={job.match.verdict} score={job.match.score} />
              ) : job.filteredOut ? (
                <span className="text-xs text-muted">Filtered: {job.filteredOut}</span>
              ) : (
                <span className="text-xs text-muted">Scoring…</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
