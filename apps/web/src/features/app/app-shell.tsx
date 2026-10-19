"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar, Button, Logo } from "@/components/ui";
import { useLogout, useSession } from "../auth/use-session";

// Simple line icons (24×24 paths), so the nav needs no icon library.
const icons = {
  overview: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  jobs: "M4 7h16v12H4zM9 7V5h6v2M4 12h16",
  applications: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  profile: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  sources: "M4 6h16M4 12h16M4 18h10",
};

const nav = [
  { href: "/app", label: "Overview", icon: icons.overview },
  { href: "/app/jobs", label: "Jobs", icon: icons.jobs },
  { href: "/app/applications", label: "Applications", icon: icons.applications },
  { href: "/app/profile", label: "Profile", icon: icons.profile },
  { href: "/app/sources", label: "Job boards", icon: icons.sources },
];

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-border bg-surface-muted lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-e">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-6">
          <Link href="/app" aria-label="Job Copilot home"><Logo /></Link>
          <Button variant="ghost" className="lg:hidden" onClick={() => logout.mutate()}>Sign out</Button>
        </div>
        {/* The pathname isn't known while prerendering a /app/jobs/[jobId] page, so the active highlight streams in. */}
        <Suspense fallback={<MainNav pathname={null} />}>
          <ActiveMainNav />
        </Suspense>
        <div className="mt-auto hidden border-t border-border p-4 lg:block">
          {session.data && (
            <div className="flex items-center gap-3">
              <Avatar name={session.data.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.data.name}</p>
                <p className="truncate text-xs text-muted">{session.data.email}</p>
              </div>
            </div>
          )}
          <Button variant="secondary" className="mt-3 w-full" onClick={() => logout.mutate()}>Sign out</Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {session.data?.isDemo && (
          <p className="border-b border-border bg-butter px-4 py-2.5 text-center text-sm">
            You&apos;re in the demo: sample candidate, sample jobs, and a simulated AI so nothing costs money.{" "}
            <Link href="/register" className="font-medium text-accent underline-offset-4 hover:underline">Create an account</Link> to use your own CV.
          </p>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 lg:px-10 lg:py-12">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="headline text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
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
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:px-3 lg:pb-0" aria-label="Main">
      {nav.map((item) => {
        const active = pathname !== null && (item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 ${active ? "bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--hairline)]" : "text-foreground/60 hover:bg-surface/70 hover:text-foreground"}`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
