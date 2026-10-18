import type { Verdict } from "@copilot/shared";

const styles: Record<Verdict, string> = {
  STRONG: "bg-accent-soft text-accent",
  GOOD: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  STRETCH: "bg-gold-soft text-gold",
  SKIP: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

export const verdictLabel: Record<Verdict, string> = { STRONG: "Strong fit", GOOD: "Good fit", STRETCH: "Stretch", SKIP: "Skip" };

export function VerdictBadge({ verdict, score }: { verdict: Verdict; score?: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[verdict]}`}>
      {verdictLabel[verdict]}
      {score !== undefined && <span className="tabular-nums opacity-80">{score}</span>}
    </span>
  );
}
