"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { authApi } from "./auth-api";

export function DemoButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const demo = useMutation({ mutationFn: authApi.demo, onSuccess: () => router.push("/app") });
  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} onClick={() => demo.mutate()} disabled={demo.isPending}>
        {demo.isPending ? "Setting up your demo…" : "Try the live demo"}
      </Button>
      {demo.isError && <p className="text-sm text-danger">{demo.error.message}</p>}
    </div>
  );
}
