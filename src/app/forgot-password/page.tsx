"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError(null); setSubmitting(true);
    try { await authApi.forgotPassword(forgotPasswordSchema.parse({ email }).email); setSent(true); }
    catch (err) { setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to send the OTP. Try again."); }
    finally { setSubmitting(false); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16"><div className="w-full max-w-sm">
    <h1 className="font-heading text-2xl font-semibold text-ink">Reset your password</h1><p className="mt-1 mb-8 text-sm text-ink/60">We&apos;ll email a one-time password to your registered address.</p>
    {sent ? <div className="space-y-5"><p className="rounded-lg border border-status-approved/30 bg-status-approved/10 px-3 py-3 text-sm text-ink">OTP sent. Check your email, then set a new password.</p><Link href="/reset-password" className="block"><Button className="w-full">Continue</Button></Link></div> : <form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink/80">Email</label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>{error && <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{error}</p>}<Button type="submit" disabled={submitting} className="w-full">{submitting ? "Sending OTP…" : "Send OTP"}</Button></form>}
    <p className="mt-6 text-sm text-ink/60"><Link href="/login" className="font-medium text-accent hover:text-accent-dark">Back to sign in</Link></p>
  </div></main>;
}
