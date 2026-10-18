import { AppShell } from "@/features/app/app-shell";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}
