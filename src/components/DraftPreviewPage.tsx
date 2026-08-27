"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useBlog } from "@/hooks/useBlogs";
import { BlogPreview, type BlogPreviewPost } from "@/components/BlogPreview";
import type { BlogFormValues } from "@/components/BlogForm";

function readDraft(draftKey: string): Partial<BlogFormValues> {
  try {
    return JSON.parse(window.localStorage.getItem(draftKey) ?? "null") ?? {};
  } catch {
    return {};
  }
}

/**
 * Full-page, chrome-free draft preview opened in its own browser tab.
 * Reads the same localStorage draft the editor writes to on every change,
 * and re-reads it on the 'storage' event — which fires in this tab whenever
 * the editor tab (a different tab) updates that key, giving a live view
 * with no polling and no network round trip.
 */
export function DraftPreviewPage({ draftKey, blogId }: { draftKey: string; blogId?: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const blogQuery = useBlog(blogId ?? "");
  const [draft, setDraft] = useState<Partial<BlogFormValues> | null>(() =>
    typeof window === "undefined" ? null : readDraft(draftKey)
  );

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === draftKey) setDraft(readDraft(draftKey));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [draftKey]);

  if (authLoading || !user || !draft) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/50">Loading preview…</div>;
  }

  const blog = blogQuery.data;
  const post: BlogPreviewPost = {
    title: draft.title ?? blog?.title ?? "",
    excerpt: draft.excerpt ?? blog?.excerpt ?? "",
    content: draft.content ?? blog?.content ?? "",
    coverImageUrl: draft.coverImageKey ?? blog?.coverImageUrls ?? [],
    tags: blog?.tags,
    status: blog?.status,
    publishedAt: blog?.publishedAt,
  };
  const contentCharacterCount = post.content.replace(/<[^>]*>/g, "").length;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <BlogPreview post={post} contentCharacterCount={contentCharacterCount} />
      </div>
    </div>
  );
}
