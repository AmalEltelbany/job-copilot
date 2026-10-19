import { ScoreRing } from "../jobs/score-ring";

/** A note in the copilot's red pen. Rotated slightly, like it was written in the margin. */
function PenNote({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={`animate-pop absolute font-hand text-[22px] leading-none text-pen ${className}`}>{children}</span>;
}

function Pill({ tone, children }: { tone: "green" | "amber" | "grey" | "blue"; children: React.ReactNode }) {
  const tones = {
    green: "bg-accent-soft text-accent",
    amber: "bg-gold-soft text-gold",
    grey: "bg-surface-muted text-muted",
    blue: "bg-[#e3ecff] text-[#2f5fc4]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/**
 * The hero: a real-looking posting, marked up by the copilot in red pen, beside the fit it worked out.
 * The only element on the landing page with a shadow, so it reads as the product sitting on the paper.
 */
export function AnnotatedPosting() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-border bg-surface text-left shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#e8e5df]" />
        <span className="size-2.5 rounded-full bg-[#e8e5df]" />
        <span className="size-2.5 rounded-full bg-[#e8e5df]" />
        <span className="ms-3 truncate text-xs text-faint">Jobs / Lumen Pay / Senior Full-Stack Engineer</span>
      </div>

      <div className="grid md:grid-cols-[1.35fr_1fr]">
        <div className="relative px-6 pb-10 pt-7 sm:px-8">
          <p className="text-xs font-medium text-faint">Greenhouse · Remote, EMEA · posted 2 days ago</p>
          <p className="mt-2 text-[26px] font-semibold tracking-tight">Senior Full-Stack Engineer</p>
          <p className="mt-4 font-serif text-[17px] leading-relaxed text-muted">
            You&apos;ll build payment dashboards and the APIs behind them, working closely with design and product.
          </p>
          <p className="mt-5 text-sm font-semibold">What you&apos;ll bring</p>
          <ul className="mt-2 flex flex-col gap-2.5 text-[15px]">
            <li>
              5+ years with <span className="pen-circle">TypeScript</span> and Node.js
            </li>
            <li>Experience designing REST APIs and data models</li>
            <li>
              Comfortable with <span className="underline decoration-pen decoration-wavy decoration-2 underline-offset-4">event-driven systems</span>
            </li>
            <li className="text-faint line-through decoration-pen decoration-2">Kubernetes in production</li>
          </ul>
          <PenNote className="end-4 top-[202px] hidden rotate-[-4deg] [animation-delay:300ms] lg:block">6 yrs ✓ you&apos;re set</PenNote>
          <PenNote className="end-6 top-[270px] hidden rotate-[-2deg] [animation-delay:450ms] lg:block">partly: webhooks + queue</PenNote>
          <PenNote className="bottom-3 end-6 hidden rotate-[3deg] [animation-delay:600ms] sm:block">nice-to-have only</PenNote>
        </div>

        <div className="border-t border-border bg-background/60 p-6 md:border-s md:border-t-0">
          <p className="text-xs font-medium text-faint">Fit</p>
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={86} verdict="STRONG" size="lg" />
            <div className="flex flex-col items-start gap-1.5">
              <Pill tone="green">Strong fit</Pill>
              <span className="text-xs text-muted">Senior level</span>
            </div>
          </div>
          <ul className="mt-5 flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between gap-2">TypeScript <Pill tone="green">Met</Pill></li>
            <li className="flex items-center justify-between gap-2">REST APIs <Pill tone="green">Met</Pill></li>
            <li className="flex items-center justify-between gap-2">Event-driven <Pill tone="amber">Partly</Pill></li>
            <li className="flex items-center justify-between gap-2">Kubernetes <Pill tone="grey">Nice to have</Pill></li>
          </ul>
          <div className="mt-6 rounded-lg bg-accent px-3 py-2 text-center text-sm font-medium text-accent-foreground">Draft cover letter</div>
        </div>
      </div>
    </div>
  );
}

/** CV in, structured profile out. */
export function ProfilePreview() {
  return (
    <div aria-hidden className="rounded-xl border border-border bg-surface p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-surface-muted text-xs font-semibold text-muted">PDF</span>
        <div>
          <p className="text-sm font-semibold">cv.pdf → your profile</p>
          <p className="text-xs text-muted">Read by Claude · you can edit every field</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
        <dt className="text-muted">Level</dt>
        <dd><Pill tone="blue">Mid → Senior</Pill></dd>
        <dt className="text-muted">Experience</dt>
        <dd>6 years</dd>
        <dt className="text-muted">Skills</dt>
        <dd className="flex flex-wrap gap-1.5">
          {["TypeScript", "NestJS", "React", "PostgreSQL"].map((s) => <Pill key={s} tone="grey">{s}</Pill>)}
        </dd>
        <dt className="text-muted">Targets</dt>
        <dd>Full-stack, Backend</dd>
      </dl>
    </div>
  );
}

/** Each requirement, with the line from the profile that backs it. */
export function EvidencePreview() {
  const rows = [
    { req: "TypeScript, 5+ years", evidence: "“6 years across two product teams”", tone: "green" as const, label: "Met" },
    { req: "Designs REST APIs", evidence: "“Owned a NestJS payments service”", tone: "green" as const, label: "Met" },
    { req: "Event-driven systems", evidence: "“Built webhook retries with a queue”", tone: "amber" as const, label: "Partly" },
  ];
  return (
    <ul aria-hidden className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.req} className="rounded-xl border border-border bg-surface p-4 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{r.req}</span>
            <Pill tone={r.tone}>{r.label}</Pill>
          </div>
          <p className="mt-1.5 font-serif text-[15px] italic text-muted">{r.evidence}</p>
        </li>
      ))}
    </ul>
  );
}

/** A drafted letter after the fact-check pass. */
export function FactCheckPreview() {
  return (
    <div aria-hidden className="relative rounded-xl border border-border bg-surface p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <p className="text-xs font-medium text-faint">Cover letter · checked against your profile</p>
      <p className="mt-3 font-serif text-[17px] leading-relaxed">
        Dear Lumen Pay team, over the last six years I&apos;ve built product APIs end to end, most recently owning a NestJS payments
        service. <span className="bg-gold-soft px-0.5">I also managed a team of eight engineers</span>, and I&apos;d love to bring that
        experience to your dashboards…
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone="green">2 claims verified</Pill>
        <Pill tone="amber">1 not in your profile</Pill>
      </div>
      <span className="animate-pop absolute -top-4 end-4 rotate-[-5deg] font-hand text-[22px] text-pen">really? not on your CV</span>
    </div>
  );
}
