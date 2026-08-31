"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { StatusBadge } from "@/components/StatusBadge";
import { BlogForm, BlogFormValues } from "@/components/BlogForm";
import { Button } from "@/components/ui/Button";
import {
  useBlog,
  usePublishBlog,
  useReviewBlog,
  useSubmitForReview,
  useUnpublishBlog,
  useUpdateBlog,
} from "@/hooks/useBlogs";
import { ApiError } from "@/lib/api";

const PIPELINE = [
  "draft",
  "submitted_for_review",
  "approved",
  "published",
] as const;

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const blogQuery = useBlog(id);
  const updateBlog = useUpdateBlog(id);
  const submitForReview = useSubmitForReview(id);
  const reviewBlog = useReviewBlog(id);
  const publishBlog = usePublishBlog(id);
  const unpublishBlog = useUnpublishBlog(id);

  const busy =
    updateBlog.isPending ||
    submitForReview.isPending ||
    reviewBlog.isPending ||
    publishBlog.isPending ||
    unpublishBlog.isPending;

  const activeError =
    submitForReview.error ??
    reviewBlog.error ??
    publishBlog.error ??
    unpublishBlog.error ??
    blogQuery.error;
  const error = activeError
    ? activeError instanceof ApiError
      ? activeError.message
      : "That action failed."
    : null;

  if (blogQuery.isLoading) {
    return (
      <AuthenticatedShell>
        <p className="text-sm text-ink/40">Loading…</p>
      </AuthenticatedShell>
    );
  }
  const blog = blogQuery.data;
  if (!blog) {
    return (
      <AuthenticatedShell>
        <p className="text-sm text-status-rejected">
          {error ?? "Post not found."}
        </p>
      </AuthenticatedShell>
    );
  }

  const isOwner = blog.authorId === user?.id;
  const canEdit =
    (isOwner &&
      hasPermission("blog.edit_own") &&
      ["draft", "rejected"].includes(blog.status)) ||
    hasPermission("blog.edit_any");
  const canSubmit =
    isOwner &&
    hasPermission("blog.submit_review") &&
    ["draft", "rejected"].includes(blog.status);
  const canReview =
    hasPermission("blog.review") && blog.status === "submitted_for_review";
  const canPublish =
    hasPermission("blog.publish") && blog.status === "approved";
  const canUnpublish =
    hasPermission("blog.publish") && blog.status === "published";

  async function handleSaveEdits(values: BlogFormValues) {
    try {
      await updateBlog.mutateAsync(values);
    } catch {
      // surfaced via `error` above
    }
  }

  async function handleReview(action: "approve" | "reject", comment?: string) {
    try {
      await reviewBlog.mutateAsync({ action, comment });
      setShowRejectBox(false);
      setRejectComment("");
    } catch {
      // surfaced via `error` above
    }
  }

  const pipelineIndex =
    blog.status === "rejected"
      ? 0
      : PIPELINE.indexOf(blog.status as (typeof PIPELINE)[number]);

  return (
    <AuthenticatedShell>
      <div className="max-w-2xl">
        <button
          onClick={() => router.push("/blogs")}
          className="text-sm text-ink/50 hover:text-ink mb-4"
        >
          ← Back to blogs
        </button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-ink">
            {blog.title || "Untitled post"}
          </h1>
          <StatusBadge status={blog.status} />
        </div>

        {/* Pipeline strip */}
        <div className="flex items-center gap-1 mb-6">
          {PIPELINE.map((stage, i) => (
            <div key={stage} className="flex items-center flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  i <= pipelineIndex && blog.status !== "rejected"
                    ? "bg-accent"
                    : "bg-line"
                }`}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {blog.reviews.length > 0 && (
          <div className="mb-6 space-y-2">
            {blog.reviews.map((r) => (
              <div
                key={r.id}
                className={`text-sm rounded-lg px-3.5 py-2.5 border ${
                  r.action === "approve"
                    ? "bg-status-approved/10 border-status-approved/20"
                    : "bg-status-rejected/10 border-status-rejected/20"
                }`}
              >
                <span className="font-medium">
                  {r.action === "approve" ? "Approved" : "Rejected"}
                </span>
                {r.comment && (
                  <span className="text-ink/70"> — {r.comment}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <BlogForm
            blog={blog}
            readOnly={!canEdit}
            onSave={handleSaveEdits}
            saving={updateBlog.isPending}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-5">
          {canSubmit && (
            <Button disabled={busy} onClick={() => submitForReview.mutate()}>
              Submit for review
            </Button>
          )}

          {canReview && !showRejectBox && (
            <>
              <Button disabled={busy} onClick={() => handleReview("approve")}>
                Approve
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setShowRejectBox(true)}
              >
                Reject
              </Button>
            </>
          )}

          {canPublish && (
            <Button disabled={busy} onClick={() => publishBlog.mutate()}>
              Publish
            </Button>
          )}

          {canUnpublish && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => unpublishBlog.mutate()}
            >
              Unpublish
            </Button>
          )}
        </div>

        {showRejectBox && (
          <div className="mt-4 border border-line rounded-lg p-4">
            <label className="block text-sm font-medium text-ink/80 mb-1.5">
              Comment for the editor (required)
            </label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-panel px-3.5 py-2.5 text-sm outline-none focus:border-accent mb-3"
              placeholder="What needs to change before this can be approved?"
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => handleReview("reject", rejectComment)}
              >
                Confirm reject
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setShowRejectBox(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
