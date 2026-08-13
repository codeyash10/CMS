"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { BlogForm, BlogFormValues } from "@/components/BlogForm";
import { useCreateBlog } from "@/hooks/useBlogs";
import { ApiError } from "@/lib/api";

export default function NewBlogPage() {
  const { activeCompanyId } = useAuth();
  const router = useRouter();
  const createBlog = useCreateBlog();

  async function handleSave(values: BlogFormValues) {
    if (!activeCompanyId) return;
    try {
      const blog = await createBlog.mutateAsync({ companyId: activeCompanyId, ...values });
      router.push(`/blogs/${blog.id}`);
    } catch {
      // surfaced via createBlog.error below
    }
  }

  const error =
    createBlog.error instanceof ApiError ? createBlog.error.message : createBlog.error ? "Couldn't save the post." : null;

  return (
    <AuthenticatedShell>
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-ink mb-6">New post</h1>
        {error && (
          <p className="mb-4 text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <BlogForm onSave={handleSave} saving={createBlog.isPending} />
      </div>
    </AuthenticatedShell>
  );
}
