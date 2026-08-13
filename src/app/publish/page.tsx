"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useBlogs } from "@/hooks/useBlogs";

export default function PublishQueuePage() {
  const { activeCompanyId } = useAuth();
  const { data: blogs = [], isLoading: loading } = useBlogs(activeCompanyId, "approved");

  return (
    <AuthenticatedShell>
      <h1 className="text-xl font-semibold text-ink mb-1">Publish queue</h1>
      <p className="text-sm text-ink/60 mb-6">Approved posts ready to go live.</p>

      <div className="bg-panel border border-line rounded-lg divide-y divide-line">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Loading…</p>
        ) : blogs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Nothing approved and waiting right now.</p>
        ) : (
          blogs.map((b) => (
            <Link
              key={b.id}
              href={`/blogs/${b.id}`}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-canvas transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-ink">{b.title}</p>
                <p className="text-xs text-ink/40 font-mono mt-0.5">
                  Approved {new Date(b.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-accent font-medium">Publish →</span>
            </Link>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
