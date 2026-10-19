import type { Verdict } from "@copilot/shared";

const ringColor: Record<Verdict, string> = {
  STRONG: "text-accent",
  GOOD: "text-[#3f6fd1]",
  STRETCH: "text-gold",
  SKIP: "text-muted",
};

const sizes = { sm: { box: 44, stroke: 4, text: "text-sm" }, lg: { box: 88, stroke: 7, text: "text-2xl" } };

/** Fit score (0-100) as a ring that fills in, coloured by verdict. */
export function ScoreRing({ score, verdict, size = "sm" }: { score: number; verdict: Verdict; size?: keyof typeof sizes }) {
  const { box, stroke, text } = sizes[size];
  const radius = (box - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: box, height: box }} aria-label={`Fit score ${score} out of 100`}>
      <svg viewBox={`0 0 ${box} ${box}`} className={`absolute inset-0 -rotate-90 ${ringColor[verdict]}`} aria-hidden>
        <circle cx={box / 2} cy={box / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-muted" />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - score / 100)}
          className="animate-draw-ring"
          style={{ "--ring-length": length } as React.CSSProperties}
        />
      </svg>
      <span className={`font-semibold tracking-tight tabular-nums ${text}`}>{score}</span>
    </span>
  );
}
