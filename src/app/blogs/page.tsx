"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { StatusBadge } from "@/components/StatusBadge";
import { RequirePermission } from "@/components/RequirePermission";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useBlogs } from "@/hooks/useBlogs";
import { BlogStatus } from "@/lib/mock-db";

const FILTERS: { label: string; value: BlogStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "In review", value: "submitted_for_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Published", value: "published" },
];

export default function BlogsPage() {
  return (
    <AuthenticatedShell>
      <Suspense
        fallback={
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Loading…</p>
        }
      >
        <BlogsContent />
      </Suspense>
    </AuthenticatedShell>
  );
}

function BlogsContent() {
  const { activeCompanyId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") ?? "") as BlogStatus | "";
  const { data: blogs = [], isLoading: loading } = useBlogs(
    activeCompanyId,
    status,
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Blogs</h1>
        <RequirePermission permission="blog.create">
          <Link
            href="/blogs/new"
            className={buttonVariants({ variant: "primary" })}
          >
            New post
          </Link>
        </RequirePermission>
      </div>

      <div className="flex gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() =>
              router.push(f.value ? `/blogs?status=${f.value}` : "/blogs")
            }
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
              status === f.value
                ? "bg-ink text-canvas"
                : "bg-panel border border-line text-ink/60 hover:border-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-panel border border-line rounded-lg divide-y divide-line">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">Loading…</p>
        ) : blogs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink/40 text-center">
            No blogs match this filter.
          </p>
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
                  Updated {new Date(b.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))
        )}
      </div>
    </>
  );
}
