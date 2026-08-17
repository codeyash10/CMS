"use client";

import { useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/schemas/auth";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError(null); setSuccess(null); setSubmitting(true);
    try {
      const { oldPassword: validOldPassword, newPassword: validNewPassword } = changePasswordSchema.parse({ oldPassword, newPassword, confirmPassword });
      const response = await authApi.changePassword({ oldPassword: validOldPassword, newPassword: validNewPassword });
      setSuccess(response.data.message); setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    }
    catch (err) { setError(err instanceof ApiError || err instanceof Error ? err.message : "Unable to change your password. Try again."); }
    finally { setSubmitting(false); }
  }
  return <AuthenticatedShell><div className="max-w-md"><h1 className="font-heading text-2xl font-semibold text-ink">Change password</h1><p className="mt-1 mb-8 text-sm text-ink/60">Use a strong new password with at least eight characters.</p><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="oldPassword" className="mb-1.5 block text-sm font-medium text-ink/80">Current password</label><Input id="oldPassword" type="password" required autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></div><div><label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-ink/80">New password</label><Input id="newPassword" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div><div><label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink/80">Confirm new password</label><Input id="confirmPassword" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>{error && <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{error}</p>}{success && <p className="rounded-lg border border-status-approved/30 bg-status-approved/10 px-3 py-2 text-sm text-ink">{success}</p>}<Button type="submit" disabled={submitting}>{submitting ? "Updating password…" : "Update password"}</Button></form></div></AuthenticatedShell>;
}
