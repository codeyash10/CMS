"use client";

import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useUsers } from "@/hooks/useUsers";

function renderRole(role: unknown) {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "label" in role) {
    const label = (role as { label?: string }).label;
    return label || "—";
  }
  return "—";
}

export default function UsersPage() {
  const { data: users = [], isLoading: loading } = useUsers();

  return (
    <AuthenticatedShell>
      <h1 className="mb-1 text-xl font-semibold text-ink">Users</h1>
      <p className="mb-6 text-sm text-ink/60">People with access to this workspace.</p>

      <div className="divide-y divide-line rounded-lg border border-line bg-panel">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-ink/40">Loading...</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink/40">{user.email}</p>
              </div>
              <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-xs text-ink/60">
                {renderRole(user.role)}
              </span>
            </div>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
