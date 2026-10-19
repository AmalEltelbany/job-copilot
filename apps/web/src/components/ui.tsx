import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// Green is the single filled action per screen; everything else is a tint or plain text.
const buttonVariants = {
  primary: "bg-accent text-accent-foreground hover:bg-[#0e6a4e]",
  secondary: "bg-accent-soft text-accent hover:bg-[#d3ebdf]",
  ghost: "text-foreground/80 hover:bg-surface-muted hover:text-foreground",
  danger: "text-danger hover:bg-[#fbe9e7]",
  inverse: "bg-surface text-foreground hover:bg-background",
};

export type ButtonVariant = keyof typeof buttonVariants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition duration-200 placeholder:text-faint focus:border-accent/50 focus:ring-3 focus:ring-accent-soft ${className}`}
      {...props}
    />
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-danger">{error}</span>}
    </label>
  );
}

const ringColors = ["border-accent", "border-tomato", "border-apricot", "border-cornflower"];

/** Initials in a white circle with a coloured ring, picked from the name so it stays stable. */
export function Avatar({ name, title }: { name: string; title?: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (
    <span
      title={title ?? name}
      className={`inline-flex size-9 items-center justify-center rounded-full border-2 bg-surface text-xs font-semibold ${ringColors[Math.abs(hash) % ringColors.length]}`}
    >
      {initials}
    </span>
  );
}

/** A notebook page with three lines and a green tick: the copilot checked it. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#fff" stroke="#191714" strokeOpacity="0.15" strokeWidth="2" />
      <path d="M18 22h28M18 32h20M18 42h14" stroke="#191714" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 41l5 5 10-12" fill="none" stroke="#127a5a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">Job Copilot</span>
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-24"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <Button variant="ghost" className="px-2.5" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
