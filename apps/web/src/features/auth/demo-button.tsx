"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, type ButtonVariant } from "@/components/ui";
import { authApi } from "./auth-api";

export function DemoButton({
  variant = "primary",
  className = "",
  label = "Try the live demo",
}: {
  variant?: ButtonVariant;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const demo = useMutation({ mutationFn: authApi.demo, onSuccess: () => router.push("/app") });
  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} className={className} onClick={() => demo.mutate()} disabled={demo.isPending}>
        {demo.isPending ? "Setting up your demo…" : label}
      </Button>
      {demo.isError && <p className="text-sm text-danger">{demo.error.message}</p>}
    </div>
  );
}
