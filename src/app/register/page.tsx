"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
  { label: "Reviewer", value: "reviewer" },
  { label: "Super Admin", value: "super_admin" },
] as const;

export default function RegisterPage() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"] | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError("Select a role."); return; }
    setError(null);
    setSubmitting(true);

    try {
      await register({ firstName, lastName, email, password, role });
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden lg:flex flex-col justify-between bg-[#0c1a35] text-white px-14 py-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/crediple_dark.png" alt="Crediple" className="h-7 w-auto" />

        <div>
          <h1 className="font-heading text-3xl font-semibold leading-tight mb-5 max-w-sm">
            Create your workspace access and start managing content.
          </h1>
          <p className="text-sm text-white/50 max-w-md leading-relaxed">
            New users are registered with the default backend role. RBAC-based module access will be
            applied from the user role returned by the backend.
          </p>
        </div>

        <div />
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-canvas">
        <div className="w-full max-w-sm">
          <h2 className="font-heading text-2xl font-semibold text-ink mb-1">Sign up</h2>
          <p className="text-sm text-ink/60 mb-8">Create your CMS account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink/80 mb-1.5" htmlFor="firstName">
                  First name
                </label>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ava"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/80 mb-1.5" htmlFor="lastName">
                  Last name
                </label>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@crediple.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as (typeof ROLE_OPTIONS)[number]["value"])}
                className="h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors hover:border-accent/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="" disabled>
                  Select a role
                </option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:text-accent-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
