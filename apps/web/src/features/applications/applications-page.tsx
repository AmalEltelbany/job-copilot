"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { applicationStatuses } from "@copilot/shared";
import { PageHeader } from "../app/app-shell";
import { copilotApi, keys } from "../app/api";

export function ApplicationsPage() {
  const apps = useQuery({ queryKey: keys.applications, queryFn: copilotApi.applications });

  return (
    <>
      <PageHeader title="Applications" description="Where each application stands." />
      {apps.isPending && <p className="text-sm text-muted">Loading…</p>}
      {apps.data?.length === 0 && <p className="text-sm text-muted">No applications yet. Open a job and start one.</p>}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {applicationStatuses.map((status) => {
          const items = apps.data?.filter((a) => a.status === status) ?? [];
          return (
            <section key={status} aria-label={status} className="rounded-xl bg-surface-muted p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {status.toLowerCase()} <span className="font-normal">{items.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((a) => (
                  <li key={a.id}>
                    <Link href={`/app/jobs/${a.job.id}`} className="block rounded-lg border border-border bg-surface p-2.5 text-sm hover:border-accent">
                      <span className="font-medium">{a.job.title}</span>
                      <span className="block text-xs text-muted">{a.job.company}</span>
                      {a.unsupportedClaims.length > 0 && <span className="mt-1 block text-xs text-amber-600">⚠ letter needs checking</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
