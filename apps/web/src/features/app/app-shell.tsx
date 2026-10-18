"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { useLogout, useSession } from "../auth/use-session";

const nav = [
  { href: "/app", label: "Overview" },
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/applications", label: "Applications" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/sources", label: "Job boards" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/app" className="font-semibold">✦ Job Copilot</Link>
          {/* The pathname isn't known while prerendering a /app/jobs/[jobId] page, so the active highlight streams in. */}
          <Suspense fallback={<MainNav pathname={null} />}>
            <ActiveMainNav />
          </Suspense>
          <div className="ms-auto flex items-center gap-2 text-sm text-muted">
            {session.data?.name}
            <Button variant="ghost" onClick={() => logout.mutate()}>Sign out</Button>
          </div>
        </div>
      </header>
      {session.data?.isDemo && (
        <p className="bg-surface-muted px-4 py-2 text-center text-sm">
          You&apos;re in the demo: sample candidate, sample jobs, and a simulated AI so nothing costs money.{" "}
          <Link href="/register" className="text-accent hover:underline">Create an account</Link> to use your own CV.
        </p>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

function ActiveMainNav() {
  return <MainNav pathname={usePathname()} />;
}

function MainNav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-wrap gap-1 text-sm" aria-label="Main">
      {nav.map((item) => {
        const active = pathname !== null && (item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 ${active ? "bg-surface-muted font-medium" : "text-muted hover:text-foreground"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
