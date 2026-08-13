"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink/50">Loading…</div>;
  }
  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
