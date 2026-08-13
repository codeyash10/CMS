"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";

export default function DashboardPage() {
  const { activeCompanyId, user } = useAuth();
  const { data: summary } = useDashboardSummary(activeCompanyId);

  return (
    <AuthenticatedShell>
      <h1 className="text-xl font-semibold text-ink mb-1">Dashboard</h1>
      <p className="text-sm text-ink/60 mb-8">Welcome back, {user?.name.split(" ")[0]}.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card label="Drafts" value={summary?.draftCount} href="/blogs?status=draft" />
        <Card label="Awaiting review" value={summary?.pendingReviewCount} href="/review" />
        <Card label="Awaiting publish" value={summary?.pendingPublishCount} href="/publish" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-medium text-ink/80 mb-3">Recently published</h2>
          <ul className="bg-panel border border-line rounded-lg divide-y divide-line">
            {summary?.recentlyPublished.length ? (
              summary.recentlyPublished.map((b) => (
                <li key={b.id} className="px-4 py-3 text-sm flex justify-between">
                  <Link href={`/blogs/${b.id}`} className="hover:text-accent">
                    {b.title}
                  </Link>
                  <span className="text-xs text-ink/40 font-mono">
                    {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ""}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-sm text-ink/40 text-center">Nothing published yet.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-medium text-ink/80 mb-3">Recent activity</h2>
          <ul className="bg-panel border border-line rounded-lg divide-y divide-line">
            {summary?.recentActivity.length ? (
              summary.recentActivity.map((l) => (
                <li key={l.id} className="px-4 py-3 text-sm flex justify-between">
                  <span className="capitalize">{l.action.replace(/_/g, " ")}</span>
                  <span className="text-xs text-ink/40 font-mono">
                    {new Date(l.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-sm text-ink/40 text-center">No activity yet.</li>
            )}
          </ul>
        </section>
      </div>
    </AuthenticatedShell>
  );
}

function Card({ label, value, href }: { label: string; value?: number; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-panel border border-line rounded-lg px-5 py-4 hover:border-accent transition-colors"
    >
      <p className="text-2xl font-semibold font-mono text-ink">{value ?? "—"}</p>
      <p className="text-sm text-ink/60 mt-1">{label}</p>
    </Link>
  );
}
