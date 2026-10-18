import Link from "next/link";
import { DemoButton } from "@/features/auth/demo-button";

const steps = [
  { title: "Upload your CV", body: "Claude reads it into a structured profile that you review and correct. It's the only source of truth about you." },
  { title: "Follow companies", body: "Point it at Greenhouse, Lever and Ashby job boards, or Remotive. New postings are fetched in the background." },
  { title: "See real fit, not keyword soup", body: "Cheap rules drop obvious mismatches first; Claude scores the rest against each requirement, with evidence." },
  { title: "Draft letters that don't lie", body: "Every cover letter is fact-checked against your profile by a second pass. Anything unsupported is flagged, not sent." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <header className="flex items-center justify-between">
        <span className="font-semibold">✦ Job Copilot</span>
        <nav className="flex gap-2 text-sm">
          <Link className="rounded-lg px-3 py-2 text-muted hover:text-foreground" href="/login">Sign in</Link>
          <Link className="rounded-lg bg-surface px-3 py-2 ring-1 ring-border hover:bg-surface-muted" href="/register">Sign up</Link>
        </nav>
      </header>

      <section className="mt-24 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Apply to fewer jobs. Better ones.</h1>
        <p className="mt-5 text-lg text-muted">
          An AI copilot that finds roles matching your real experience, explains the fit, and drafts honest cover letters. You stay in charge: it never applies on your behalf.
        </p>
        <div className="mt-8 flex flex-wrap items-start gap-3">
          <DemoButton />
          <Link className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted hover:text-foreground" href="https://github.com/AmalEltelbany/job-copilot">
            View the code →
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-border bg-surface p-5">
            <span className="text-xs font-medium text-accent">0{i + 1}</span>
            <h2 className="mt-1 font-medium">{s.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-16 text-sm text-muted">
        Built with Next.js, NestJS, PostgreSQL, pg-boss and Claude by{" "}
        <a className="text-accent hover:underline" href="https://portfolio-amaleltelbany.vercel.app">Amal El-Telbany</a>.
      </footer>
    </main>
  );
}
