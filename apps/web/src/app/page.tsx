import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { DemoButton } from "@/features/auth/demo-button";
import { AnnotatedPosting, EvidencePreview, FactCheckPreview, ProfilePreview } from "@/features/landing/notebook";

const repo = "https://github.com/AmalEltelbany/job-copilot";

const stats = [
  { stat: "0", label: "model calls for clear mismatches", body: "A rule-based filter runs before any AI call." },
  { stat: "1×", label: "scored per profile version", body: "Re-syncing a board never re-scores a job you have." },
  { stat: "≤ 40", label: "jobs queued per sync", body: "Background work on a Postgres queue with retries." },
  { stat: "Daily", label: "AI budget per person", body: "Enforced and logged in one place, per call." },
];

const faqs = [
  { q: "Does it apply to jobs for me?", a: "No, on purpose. Job Copilot opens the employer's application page and you submit it yourself. For mid and senior roles, a few well-matched, honest applications beat mass applying." },
  { q: "What does the demo use?", a: "A sample candidate, sample jobs and a simulated model, so it's free and instant. Create an account to upload your own CV." },
  { q: "How do you stop the AI from inventing experience?", a: "Your profile is the only source of facts, every “met” must quote it, and a separate fact-checking pass flags any claim it can't support." },
  { q: "Which job boards are supported?", a: "Public Greenhouse, Lever and Ashby boards, and Remotive. They're read through their official public APIs, with no scraping." },
];

function Feature({
  index,
  title,
  body,
  panel,
  panelClass,
  flip = false,
}: {
  index: string;
  title: ReactNode;
  body: string;
  panel: ReactNode;
  panelClass: string;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? "lg:order-2" : ""}>
        <p className="font-hand text-2xl text-pen">{index}</p>
        <h3 className="headline mt-2 text-4xl sm:text-5xl">{title}</h3>
        <p className="mt-5 max-w-md font-serif text-xl leading-relaxed text-muted">{body}</p>
      </div>
      <div className={`rounded-xl p-6 sm:p-10 ${panelClass}`}>{panel}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 bg-background/90 shadow-[0_0.7px_1.5px_rgba(0,0,0,0.015),0_3px_9px_rgba(0,0,0,0.03)] backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <Link href="/" aria-label="Job Copilot home"><Logo /></Link>
          <div className="hidden gap-1 text-sm text-foreground/55 md:flex">
            <a href="#how" className="rounded-lg px-3 py-2 transition-colors hover:text-foreground">How it works</a>
            <a href="#honest" className="rounded-lg px-3 py-2 transition-colors hover:text-foreground">Honest by design</a>
            <a href="#faq" className="rounded-lg px-3 py-2 transition-colors hover:text-foreground">FAQ</a>
            <a href={repo} className="rounded-lg px-3 py-2 transition-colors hover:text-foreground">GitHub</a>
          </div>
          <div className="ms-auto flex items-center gap-1 text-sm font-medium">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-foreground/80 hover:bg-surface-muted sm:block">Log in</Link>
            <Link href="/register" className="whitespace-nowrap rounded-lg bg-accent-soft px-4 py-2 text-accent hover:bg-[#d3ebdf]">Create account</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-5 pb-24 pt-16 text-center sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted">
            <span className="size-1.5 rounded-full bg-accent" /> Your job-search notebook, with a copilot
          </p>
          <h1 className="headline mx-auto mt-7 max-w-4xl text-[clamp(2.9rem,7.4vw,5.6rem)]">
            Apply to fewer jobs.
            <br />
            <span className="word-pill">Better</span> ones.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl font-serif text-[21px] leading-relaxed text-muted">
            Job Copilot reads real postings against your CV, marks up what fits and what doesn&apos;t, and drafts cover letters that are
            fact-checked before you send them.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
            <DemoButton className="px-5 py-2.5 text-[15px]" />
            <a href={repo} className="rounded-lg px-5 py-2.5 text-[15px] font-medium text-foreground/80 hover:bg-surface-muted">Read the code</a>
          </div>
          <p className="mt-4 text-sm text-faint">Free demo with a sample CV · no sign-up · it never applies for you</p>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <span aria-hidden className="animate-pop absolute -top-10 start-2 hidden rotate-[-6deg] font-hand text-2xl text-pen [animation-delay:200ms] md:block">
              marked up by your copilot ↓
            </span>
            <AnnotatedPosting />
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-12 gap-y-4 px-5 py-10">
            <span className="text-sm text-muted">Reads public job boards from</span>
            {["Greenhouse", "Lever", "Ashby", "Remotive"].map((name) => (
              <span key={name} className="text-2xl font-semibold tracking-tight text-foreground/55">{name}</span>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto flex max-w-[1200px] scroll-mt-20 flex-col gap-24 px-5 py-28">
          <Feature
            index="01 · your profile"
            title={<>It reads your CV, <span className="word-pill">not</span> just keywords</>}
            body="Claude turns your CV into a structured profile you check and correct. It's the only thing the copilot knows about you, so nothing gets made up later."
            panel={<ProfilePreview />}
            panelClass="bg-apricot"
          />
          <Feature
            flip
            index="02 · the fit"
            title={<>Every &ldquo;met&rdquo; comes with <span className="pen-circle">evidence</span></>}
            body="Cheap rules drop clear mismatches first. Claude scores the rest requirement by requirement and quotes the line in your profile behind every match."
            panel={<EvidencePreview />}
            panelClass="bg-cornflower"
          />
          <div id="honest" className="scroll-mt-24">
            <Feature
              index="03 · the letter"
              title="Cover letters that don't make things up"
              body="A second, independent pass checks every claim against your profile. Anything it can't back up is flagged for you before you send, never hidden."
              panel={<FactCheckPreview />}
              panelClass="bg-tomato"
            />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-28">
          <h2 className="headline max-w-2xl text-4xl sm:text-5xl">Careful with your time, and with the AI bill</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-forest p-8 text-white md:col-span-2">
              <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-5xl font-semibold tracking-tight">{s.stat}</dt>
                    <dd className="mt-2 font-medium">{s.label}</dd>
                    <dd className="mt-1 text-sm text-white/60">{s.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-xl border border-border bg-surface p-7">
              <h3 className="text-[22px] font-bold tracking-tight">Measured, not guessed</h3>
              <p className="mt-2 leading-relaxed text-muted">
                Evals run against the real model with golden cases, a prompt-injection posting and planted false claims the fact-checker
                has to catch.
              </p>
            </div>
            <div className="rounded-xl bg-butter p-7">
              <h3 className="text-[22px] font-bold tracking-tight">You stay in charge</h3>
              <p className="mt-2 leading-relaxed text-foreground/75">
                It opens the employer&apos;s page and you apply yourself. A few honest, well-matched applications beat a hundred sent blind.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-24 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <h2 className="headline text-4xl sm:text-5xl">Questions</h2>
              <p className="mt-4 font-serif text-xl text-muted">The short answers.</p>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-border bg-surface px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
                    {f.q}
                    <span aria-hidden className="text-xl text-faint transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-28 text-center">
          <h2 className="headline text-[clamp(2.4rem,5vw,4rem)]">
            See your <span className="pen-circle">fit</span>, not just the title.
          </h2>
          <p className="mx-auto mt-5 max-w-md font-serif text-xl text-muted">Explore the demo with a sample CV and real-looking jobs.</p>
          <div className="mt-8 flex justify-center">
            <DemoButton label="Open the demo" className="px-5 py-2.5 text-[15px]" />
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted">
          <Logo className="text-foreground" />
          <span>
            Designed and built by{" "}
            <a className="font-medium text-foreground underline decoration-pen decoration-2 underline-offset-4" href="https://portfolio-amaleltelbany.vercel.app">
              Amal El-Telbany
            </a>
            {" · "}
            <a className="hover:text-foreground" href={repo}>Source on GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
