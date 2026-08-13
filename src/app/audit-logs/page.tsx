"use client";

import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export default function AuditLogsPage() {
  const { activeCompanyId } = useAuth();
  const { data: logs = [], isLoading: loading } = useAuditLogs(activeCompanyId);

  return (
    <AuthenticatedShell>
      <h1 className="text-xl font-semibold text-ink mb-1">Audit log</h1>
      <p className="text-sm text-ink/60 mb-6">Every workflow action, in order.</p>

      <div className="bg-panel border border-line rounded-lg divide-y divide-line">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">No activity recorded yet.</p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{l.action.replace(/_/g, " ")}</span>
                {l.fromStatus && l.toStatus && (
                  <span className="text-ink/50 font-mono text-xs ml-2">
                    {l.fromStatus} → {l.toStatus}
                  </span>
                )}
                {l.comment && <span className="text-ink/50"> — "{l.comment}"</span>}
              </div>
              <span className="text-xs text-ink/40 font-mono whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
