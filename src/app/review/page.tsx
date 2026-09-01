"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useBlogs } from "@/hooks/useBlogs";

export default function ReviewQueuePage() {
  const { activeCompanyId } = useAuth();
  const { data: blogs = [], isLoading: loading } = useBlogs(
    activeCompanyId,
    "submitted_for_review",
  );
  return (
    <AuthenticatedShell>
      <h1 className="mb-1 text-xl font-semibold text-ink">Review queue</h1>
      <p className="mb-6 text-sm text-ink/60">
        Posts waiting for you to approve or send back.
      </p>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
        {loading ? (
          <div className="space-y-3 px-4 py-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-2/5 animate-pulse rounded bg-ink/5" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-ink/5" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-4 py-8 text-center">
            <ClipboardCheck className="mb-3 h-7 w-7 text-ink/35" />
            <p className="text-sm font-medium text-ink">
              Nothing waiting for review
            </p>
            <p className="mt-1 text-sm text-ink/50">
              Posts submitted for review will appear here.
            </p>
          </div>
        ) : (
          blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {blog.title}
                </p>
                <p className="mt-0.5 text-xs font-mono text-ink/40">
                  Submitted {new Date(blog.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-accent">
                Review →
              </span>
            </Link>
          ))
        )}
      </div>
    </AuthenticatedShell>
  );
}
