"use client";

import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuth } from "@/components/AuthProvider";
import { useCompanies } from "@/hooks/useCompanies";

export default function CompaniesPage() {
  const { hasPermission } = useAuth();
  const { data: companies = [], isLoading, error } = useCompanies();

  if (!hasPermission("company.manage")) {
    return (
      <AuthenticatedShell>
        <p className="text-sm text-status-rejected">You do not have access to this page.</p>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Companies</h1>
        <p className="mt-1 text-sm text-ink/60">All companies available to the workspace.</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
          {error instanceof Error ? error.message : "Could not load companies."}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-ink/[0.03] text-xs font-medium uppercase tracking-wide text-ink/70">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink/50">
                  Loading...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink/50">
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-4 font-medium text-ink">{company.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink/60">{company.id}</td>
                  <td className="px-5 py-4 text-xs text-ink/60">
                    {company.createdAt ? new Date(company.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-ink/60">
                    {company.updatedAt ? new Date(company.updatedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AuthenticatedShell>
  );
}
