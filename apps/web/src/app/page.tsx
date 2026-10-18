import Link from "next/link";
import { Logo } from "@/components/ui";
import { DemoButton } from "@/features/auth/demo-button";
import { FitReport } from "@/features/landing/fit-report";

const repo = "https://github.com/AmalEltelbany/job-copilot";

const steps = [
  { title: "Upload your CV", body: "Claude reads it into a structured profile: skills, level, experience. You check and correct it. It's the only thing the AI knows about you." },
  { title: "Follow the companies you like", body: "Greenhouse, Lever and Ashby job boards, plus Remotive for remote roles. New postings are fetched in the background." },
  { title: "See real fit, with evidence", body: "Cheap rules drop obvious mismatches first. Claude scores the rest requirement by requirement and quotes the line in your profile behind every “met”." },
  { title: "Send letters that don't lie", body: "A second, independent pass fact-checks every claim in the cover letter. Anything your profile can't back up is flagged before you send it." },
];

const pipeline = [
  { label: "Writer", body: "Drafts the letter from your profile only." },
  { label: "Fact-checker", body: "Lists every claim and checks it against the profile." },
  { label: "One rewrite", body: "Unsupported claims go back once. The loop is capped." },
  { label: "You", body: "See what's verified and what isn't, then decide." },
];

const production = [
  { stat: "0", label: "model calls for clear mismatches", body: "A rule-based prefilter runs before any AI call." },
  { stat: "1×", label: "scored per profile version", body: "Re-syncing a board never re-scores a job you already have." },
  { stat: "≤ 40", label: "jobs queued per sync", body: "Background work runs on a Postgres-backed queue with retries." },
  { stat: "Daily", label: "AI budget per user", body: "Enforced and logged in one place, with token usage per call." },
];

const faqs = [
  { q: "Does it apply to jobs for me?", a: "No, on purpose. Job Copilot opens the employer's application page and you submit it yourself. For mid and senior roles, a few well-matched, honest applications beat mass applying." },
  { q: "What does the demo use?", a: "A sample candidate, sample jobs and a simulated model, so it's free and instant. Create an account to upload your own CV." },
  { q: "How do you stop the AI from inventing experience?", a: "The profile is the only source of facts, every “met” must quote it, and a separate fact-checking pass flags any claim it can't support." },
  { q: "Which job boards are supported?", a: "Public Greenhouse, Lever and Ashby boards, and Remotive. They're read through their official public APIs, with no scraping." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-4">
          <Link href="/" aria-label="Job Copilot home"><Logo /></Link>
          <div className="hidden gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#honest" className="hover:text-foreground">Honest by design</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href={repo} className="hover:text-foreground">GitHub</a>
          </div>
          <div className="ms-auto flex items-center gap-2 text-sm">
            <Link className="hidden rounded-md px-3 py-2 font-medium text-muted hover:text-foreground sm:block" href="/login">Sign in</Link>
            <Link className="whitespace-nowrap rounded-md border border-foreground/80 px-4 py-2 font-medium hover:bg-foreground hover:text-background" href="/register">
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="paper-lines">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-44 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
            <div className="animate-rise">
              <p className="text-sm font-medium text-gold">An AI copilot for your job search</p>
              <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
                Apply to fewer jobs.
                <br />
                <em className="font-semibold text-accent">Better</em> ones.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Job Copilot finds roles that match your real experience, explains the fit requirement by requirement, and drafts cover letters that are fact-checked against your CV. You stay in charge: it never applies on your behalf.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <DemoButton className="px-6 py-3 text-base" />
                <a className="rounded-md px-4 py-3 text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline" href={repo}>
                  Read the code →
                </a>
              </div>
              <p className="mt-4 text-sm text-muted">Free demo with a sample CV. No sign-up.</p>
            </div>
            <FitReport />
          </div>
        </section>

        <section id="how" className="scroll-mt-8 border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-sm font-medium text-gold">How it works</p>
              <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">From CV to a shortlist you trust</h2>
              <p className="mt-4 text-muted">Four steps. The AI does the reading and the scoring; every decision stays with you.</p>
            </div>
            <ol className="flex flex-col">
              {steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-6 first:pt-0 last:border-0">
                  <span className="font-display text-3xl font-medium italic text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="honest" className="scroll-mt-8 mx-auto max-w-6xl px-4 py-24">
          <p className="text-sm font-medium text-gold">Honest by design</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-medium tracking-tight">A second AI checks the first one&apos;s work</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Drafting and fact-checking are separate calls with separate instructions, the evaluator-optimizer pattern. Unsupported claims get one rewrite, and whatever is still unsupported is shown to you, never hidden.
          </p>
          <ol className="mt-12 grid gap-3 md:grid-cols-4">
            {pipeline.map((stage, i) => (
              <li key={stage.label} className="relative rounded-xl border border-border bg-surface p-5">
                <span className="text-xs font-medium text-muted">Step {i + 1}</span>
                <p className="mt-1 font-display text-xl font-semibold">{stage.label}</p>
                <p className="mt-2 text-sm text-muted">{stage.body}</p>
                {i < pipeline.length - 1 && (
                  <span aria-hidden className="absolute -end-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-xs text-accent md:grid">→</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-accent text-accent-foreground">
          <div className="mx-auto max-w-6xl px-4 py-24">
            <p className="text-sm font-medium opacity-80">Built like production</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-medium tracking-tight">Careful with your time, and with the AI bill</h2>
            <dl className="mt-12 grid gap-px overflow-hidden rounded-xl bg-accent-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
              {production.map((item) => (
                <div key={item.label} className="bg-accent p-6">
                  <dt className="font-display text-4xl font-semibold">{item.stat}</dt>
                  <dd className="mt-1 font-medium">{item.label}</dd>
                  <dd className="mt-2 text-sm opacity-75">{item.body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm opacity-80">
              Judgment quality is measured by evals against the real model, including a prompt-injection posting and planted false claims.
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-8 mx-auto grid max-w-6xl gap-12 px-4 py-24 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-medium text-gold">Questions</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">The short answers</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {f.q}
                  <span aria-hidden className="text-accent transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-xl border border-border bg-surface px-8 py-14 text-center">
            <h2 className="font-display text-4xl font-medium tracking-tight">
              See your <em className="text-accent">fit</em>, not just the job title.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">Explore the demo with a sample CV and real-looking jobs. It takes a second.</p>
            <div className="mt-8 flex justify-center">
              <DemoButton label="Open the demo" className="px-6 py-3 text-base" />
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
          <Logo className="text-foreground" />
          <span>
            Designed and built by{" "}
            <a className="font-medium text-accent hover:underline" href="https://portfolio-amaleltelbany.vercel.app">Amal El-Telbany</a>
            {" · "}
            <a className="hover:text-foreground" href={repo}>Source on GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
