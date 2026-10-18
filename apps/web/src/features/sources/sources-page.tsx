"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sourceKinds, type SourceKind } from "@copilot/shared";
import { Button, Field, Input } from "@/components/ui";
import { PageHeader } from "../app/app-shell";
import { copilotApi, keys } from "../app/api";

const help: Record<SourceKind, { label: string; hint: string; placeholder: string }> = {
  GREENHOUSE: { label: "Greenhouse", hint: "From boards.greenhouse.io/<company>", placeholder: "vercel" },
  LEVER: { label: "Lever", hint: "From jobs.lever.co/<company>", placeholder: "plaid" },
  ASHBY: { label: "Ashby", hint: "From jobs.ashbyhq.com/<company>", placeholder: "linear" },
  REMOTIVE: { label: "Remotive (remote jobs)", hint: "A category, e.g. software-dev", placeholder: "software-dev" },
};

export function SourcesPage() {
  const queryClient = useQueryClient();
  const sources = useQuery({
    queryKey: keys.sources,
    queryFn: copilotApi.sources,
    refetchInterval: (query) => (query.state.data?.some((s) => !s.lastSyncedAt && !s.lastError) ? 3000 : false),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.sources });
    void queryClient.invalidateQueries({ queryKey: keys.dashboard });
  };
  const [kind, setKind] = useState<SourceKind>("GREENHOUSE");
  const add = useMutation({ mutationFn: copilotApi.addSource, onSuccess: refresh });
  const sync = useMutation({ mutationFn: copilotApi.syncSource, onSuccess: refresh });
  const remove = useMutation({ mutationFn: copilotApi.removeSource, onSuccess: refresh });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier")).trim();
    add.mutate({ kind, identifier, label: String(form.get("label")).trim() || identifier });
    event.currentTarget.reset();
  }

  return (
    <>
      <PageHeader
        title="Job boards"
        description="Follow the companies you'd like to work for. Their public job boards are read directly, with no scraping."
      />
      <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-[12rem_1fr_1fr_auto] md:items-end">
        <Field label="Board type">
          <select value={kind} onChange={(e) => setKind(e.target.value as SourceKind)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            {sourceKinds.map((k) => <option key={k} value={k}>{help[k].label}</option>)}
          </select>
        </Field>
        <Field label={`Company id · ${help[kind].hint}`}><Input name="identifier" placeholder={help[kind].placeholder} required /></Field>
        <Field label="Display name"><Input name="label" placeholder="Company name" /></Field>
        <Button type="submit" disabled={add.isPending}>Follow</Button>
        {add.isError && <p className="text-sm text-danger md:col-span-4">{add.error.message}</p>}
      </form>

      <ul className="mt-6 flex flex-col gap-2">
        {sources.data?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex-1">
              <p className="font-medium">{s.label}</p>
              <p className="text-xs text-muted">
                {help[s.kind].label} · {s.identifier} · {s.jobCount} jobs ·{" "}
                {s.lastError ? <span className="text-danger">{s.lastError}</span> : s.lastSyncedAt ? `synced ${new Date(s.lastSyncedAt).toLocaleString()}` : "syncing…"}
              </p>
            </div>
            <Button variant="secondary" onClick={() => sync.mutate(s.id)} disabled={sync.isPending}>Sync now</Button>
            <Button variant="danger" onClick={() => confirm(`Stop following ${s.label}? Its jobs will be removed.`) && remove.mutate(s.id)}>Remove</Button>
          </li>
        ))}
      </ul>
      {sync.isError && <p className="mt-2 text-sm text-danger">{sync.error.message}</p>}
    </>
  );
}
