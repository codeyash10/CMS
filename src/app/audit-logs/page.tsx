"use client";

import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export default function AuditLogsPage() {
  const { activeCompanyId } = useAuth();
  const { data: logs = [], isLoading: loading } = useAuditLogs(activeCompanyId);
  return (
    <AuthenticatedShell>
      <h1 className="mb-1 text-xl font-semibold text-ink">Audit log</h1>
      <p className="mb-6 text-sm text-ink/60">
        Every workflow action, in order.
      </p>
      <div className="divide-y divide-line rounded-lg border border-line bg-panel">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-ink/40">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink/40">
            No activity recorded yet.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium capitalize">
                  {log.action.replace(/_/g, " ")}
                </span>
                {log.fromStatus && log.toStatus && (
                  <span className="ml-2 font-mono text-xs text-ink/50">
                    {log.fromStatus} → {log.toStatus}
                  </span>
                )}
                {log.comment && (
                  <span className="text-ink/50">
                    {" "}
                    — &quot;{log.comment}&quot;
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap font-mono text-xs text-ink/40">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
