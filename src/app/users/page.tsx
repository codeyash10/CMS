"use client";

import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useUsers } from "@/hooks/useUsers";

export default function UsersPage() {
  const { data: users = [], isLoading: loading } = useUsers();

  return (
    <AuthenticatedShell>
      <h1 className="text-xl font-semibold text-ink mb-1">Users</h1>
      <p className="text-sm text-ink/60 mb-6">People with access to this workspace.</p>

      <div className="bg-panel border border-line rounded-lg divide-y divide-line">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Loading…</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-ink">{u.name}</p>
                <p className="text-xs text-ink/40">{u.email}</p>
              </div>
              <span className="text-xs font-mono text-ink/60 bg-canvas border border-line rounded-full px-2.5 py-0.5">
                {u.role?.label ?? "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
