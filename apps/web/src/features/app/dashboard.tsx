"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "./app-shell";
import { copilotApi, keys } from "./api";

export function Dashboard() {
  const dashboard = useQuery({
    queryKey: keys.dashboard,
    queryFn: copilotApi.dashboard,
    // Scoring runs in the background; refresh while there's work in flight.
    refetchInterval: (query) => (query.state.data?.pendingScoring ? 4000 : false),
  });
  const d = dashboard.data;

  if (dashboard.isPending) return <p className="text-sm text-muted">Loading…</p>;
  if (!d) return <p className="text-sm text-danger">{dashboard.error?.message}</p>;

  const steps = [
    { done: d.hasProfile, title: "Upload your CV", body: "Claude turns it into a profile you can check and edit.", href: "/app/profile" },
    { done: d.sources > 0, title: "Follow job boards", body: "Greenhouse, Lever, Ashby or Remotive. New jobs are fetched for you.", href: "/app/sources" },
    { done: d.scored > 0, title: "Review your matches", body: "Each job gets a score, a verdict and the requirements you meet or miss.", href: "/app/jobs" },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Your job search at a glance." />
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Jobs worth a look" value={d.jobs} />
        <Stat label="Scored" value={d.scored} hint={d.pendingScoring ? `${d.pendingScoring} in progress…` : undefined} />
        <Stat label="Strong or good fits" value={d.strongOrGood} />
        <Stat label="AI calls today" value={`${d.usage.llmCallsToday} / ${d.usage.dailyLimit}`} />
      </section>

      <h2 className="mb-3 mt-10 text-sm font-semibold">Getting started</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Link href={step.href} className="block h-full rounded-xl border border-border bg-surface p-4 hover:border-accent">
              <span className={`text-xs font-medium ${step.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
                {step.done ? "✓ Done" : `Step ${i + 1}`}
              </span>
              <span className="mt-1 block font-medium">{step.title}</span>
              <span className="mt-1 block text-sm text-muted">{step.body}</span>
            </Link>
          </li>
        ))}
      </ol>

      <h2 className="mb-3 mt-10 text-sm font-semibold">Applications</h2>
      <p className="text-sm text-muted">
        {Object.keys(d.applications).length === 0
          ? "None yet. Open a job you like and start one."
          : Object.entries(d.applications).map(([status, count]) => `${count} ${status.toLowerCase()}`).join(" · ")}
      </p>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
