import { ScoreRing } from "../jobs/score-ring";

const requirements = [
  { met: "yes", text: "5+ years building web products", evidence: "“6 years across two product teams”" },
  { met: "yes", text: "TypeScript and Node.js in production", evidence: "“Owned a NestJS payments service”" },
  { met: "partly", text: "Experience with event-driven systems", evidence: "“Built webhook retries with a queue”" },
  { met: "no", text: "Kubernetes operations", evidence: null },
] as const;

const marks = { yes: "✓", partly: "◐", no: "✕" };
const markStyle = { yes: "bg-accent-soft text-accent", partly: "bg-gold-soft text-gold", no: "bg-surface-muted text-muted" };

/** Landing hero: what a scored job and a fact-checked letter look like, as static markup. */
export function FitReport() {
  return (
    <div aria-hidden className="relative">
      <div className="animate-rise rounded-xl border border-border bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(22,32,27,0.35)]">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Fit report</p>
            <p className="mt-1.5 font-display text-xl font-semibold leading-snug">Senior Full-Stack Engineer</p>
            <p className="text-sm text-muted">Lumen Pay · Remote, EMEA</p>
          </div>
          <ScoreRing score={86} verdict="STRONG" size="lg" />
        </div>
        <p className="mt-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
          <span className="font-semibold">Strong fit.</span> Meets every must-have; one nice-to-have is missing.
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          {requirements.map((r) => (
            <li key={r.text} className="flex gap-3 text-sm">
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${markStyle[r.met]}`}>{marks[r.met]}</span>
              <span>
                {r.text}
                {r.evidence && <span className="block font-display text-[13px] italic text-muted">{r.evidence}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-rise absolute -bottom-36 -start-10 z-10 hidden w-72 rounded-xl border border-border bg-surface p-4 text-sm shadow-xl [animation-delay:250ms] sm:block">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Cover letter · fact-check</p>
        <p className="mt-2 flex gap-2"><span className="text-accent">✓</span> Owned a NestJS payments service</p>
        <p className="mt-1 flex gap-2"><span className="text-accent">✓</span> Six years of product work</p>
        <p className="mt-1 flex gap-2 rounded-md bg-gold-soft px-2 py-1 text-gold">
          <span>⚠</span> &ldquo;Managed a team of eight&rdquo; isn&apos;t in your profile
        </p>
      </div>
    </div>
  );
}
