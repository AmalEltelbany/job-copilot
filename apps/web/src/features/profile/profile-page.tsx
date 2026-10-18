"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seniorityLevels, type CandidateProfile, type ProfileDto } from "@copilot/shared";
import { Button, Field, Input } from "@/components/ui";
import { PageHeader } from "../app/app-shell";
import { copilotApi, keys } from "../app/api";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: keys.profile, queryFn: copilotApi.profile });
  const onSaved = (saved: ProfileDto) => {
    queryClient.setQueryData(keys.profile, { profile: saved });
    void queryClient.invalidateQueries({ queryKey: keys.dashboard });
    void queryClient.invalidateQueries({ queryKey: keys.allJobs });
  };
  const upload = useMutation({ mutationFn: copilotApi.uploadCv, onSuccess: onSaved });

  return (
    <>
      <PageHeader
        title="Profile"
        description="Everything Job Copilot knows about you. Scores and cover letters only use what's here, so check it carefully."
      />
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-medium">{profile.data?.profile ? "Replace your CV" : "Upload your CV"}</h2>
        <p className="mt-1 text-sm text-muted">PDF, up to 5 MB. Claude reads it and fills in the profile below for you to review.</p>
        <input
          type="file"
          accept="application/pdf"
          aria-label="CV (PDF)"
          className="mt-3 block text-sm file:me-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-accent-foreground"
          disabled={upload.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
        {upload.isPending && <p className="mt-2 text-sm text-muted">Reading your CV…</p>}
        {upload.isError && <p className="mt-2 text-sm text-danger">{upload.error.message}</p>}
      </section>

      {profile.isPending && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {profile.data?.profile && <ProfileForm key={profile.data.profile.version} profile={profile.data.profile} onSaved={onSaved} />}
    </>
  );
}

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function ProfileForm({ profile, onSaved }: { profile: ProfileDto; onSaved: (p: ProfileDto) => void }) {
  const p = profile.data;
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({ mutationFn: copilotApi.saveProfile, onSuccess: onSaved, onError: (e) => setError(e.message) });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const next: CandidateProfile = {
      ...p,
      fullName: String(form.get("fullName")),
      headline: String(form.get("headline")),
      seniority: form.get("seniority") as CandidateProfile["seniority"],
      yearsOfExperience: Number(form.get("years")),
      skills: list(form.get("skills")),
      targetRoles: list(form.get("targetRoles")),
      locations: list(form.get("locations")),
      openToRemote: form.get("openToRemote") === "on",
    };
    save.mutate(next);
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
      <p className="text-xs text-muted md:col-span-2">
        Version {profile.version}
        {profile.sourceFileName ? ` · from ${profile.sourceFileName}` : ""} · saving re-scores your jobs against the new version.
      </p>
      <Field label="Name"><Input name="fullName" defaultValue={p.fullName} required /></Field>
      <Field label="Headline"><Input name="headline" defaultValue={p.headline} /></Field>
      <Field label="Level you're applying for">
        <select name="seniority" defaultValue={p.seniority} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {seniorityLevels.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Years of professional experience">
        <Input name="years" type="number" min={0} max={50} step={0.5} defaultValue={p.yearsOfExperience} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Skills (comma separated)"><Input name="skills" defaultValue={p.skills.join(", ")} /></Field>
      </div>
      <Field label="Target roles"><Input name="targetRoles" defaultValue={p.targetRoles.join(", ")} /></Field>
      <Field label="Locations"><Input name="locations" defaultValue={p.locations.join(", ")} /></Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="openToRemote" defaultChecked={p.openToRemote} /> Open to remote roles
      </label>

      <div className="md:col-span-2">
        <h3 className="mb-2 text-sm font-medium">Experience (from your CV)</h3>
        <ul className="flex flex-col gap-3">
          {p.experience.map((e) => (
            <li key={`${e.company}-${e.start}`} className="rounded-lg bg-surface-muted p-3 text-sm">
              <p className="font-medium">{e.title} · {e.company}</p>
              <p className="text-xs text-muted">{e.start} – {e.end ?? "present"}</p>
              <ul className="mt-1 list-disc ps-5 text-muted">{e.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">To change these, update your CV and upload it again.</p>
      </div>

      {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button>
      </div>
    </form>
  );
}
