"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { useResetPassword } from "@/hooks/useResetPassword";
import { authApi } from "@/lib/auth-api";
import { resetPasswordSchema } from "@/lib/schemas/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const {
        email: validEmail,
        otp: validOtp,
        newPassword: validNewPassword,
      } = resetPasswordSchema.parse({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      await authApi.resetPassword({
        email: validEmail,
        otp: validOtp,
        newPassword: validNewPassword,
      });
      router.replace("/login?passwordReset=1");
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Unable to reset your password. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold text-ink">
          Choose a new password
        </h1>
        <p className="mt-1 mb-8 text-sm text-ink/60">
          Enter the OTP from your email and a new password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="otp"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              6-digit OTP
            </label>
            <Input
              id="otp"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              New password
            </label>
            <Input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Resetting password…" : "Reset password"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink/60">
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-dark"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
