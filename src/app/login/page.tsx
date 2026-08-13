"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";

const STAGES = ["Draft", "Review", "Approved", "Published"];

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "ava.superadmin@crediple.com" },
  { label: "Company Admin", email: "liam.admin@crediple.com" },
  { label: "Content Editor", email: "priya.editor@crediple.com" },
  { label: "Content Reviewer", email: "omar.reviewer@crediple.com" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left: pipeline panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0c1a35] text-white px-14 py-12">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          Crediple / Blog CMS
        </div>

        <div>
          <h1 className="font-heading text-3xl font-semibold leading-tight mb-10 max-w-sm">
            Every post moves through the same four stops before it goes live.
          </h1>
          <ol className="space-y-0">
            {STAGES.map((stage, i) => (
              <li key={stage} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 font-mono text-xs text-white/70">
                    {i + 1}
                  </span>
                  {i < STAGES.length - 1 && <span className="w-px h-10 bg-white/20" />}
                </div>
                <div className="pt-1 pb-6">
                  <p className="font-medium">{stage}</p>
                  <p className="text-sm text-white/50 max-w-xs">
                    {stage === "Draft" && "An editor writes and saves — nothing is visible yet."}
                    {stage === "Review" && "A reviewer reads it and approves, or sends it back with a note."}
                    {stage === "Approved" && "Ready to go live, waiting on someone with publish rights."}
                    {stage === "Published" && "Live on the site, pulled from the public read API."}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-white/40 font-mono">v1 — mock backend, roles-driven</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16 bg-canvas">
        <div className="w-full max-w-sm">
          <h2 className="font-heading text-2xl font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-sm text-ink/60 mb-8">Access your company's blog workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-2.5">
              Demo accounts (password: password123)
            </p>
            <ul className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acct) => (
                <li key={acct.email}>
                  <button
                    type="button"
                    onClick={() => setEmail(acct.email)}
                    className="text-xs text-ink/70 hover:text-accent transition-colors"
                  >
                    <span className="font-medium">{acct.label}</span>
                    <span className="text-ink/40"> — {acct.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
