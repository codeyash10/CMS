"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Blog, BlogStatus } from "@/lib/mock-db";
import { CreateBlogInput, ReviewActionInput, UpdateBlogInput } from "@/lib/schemas/blog";

export function useBlogs(companyId: string | null, status?: BlogStatus | "") {
  return useQuery({
    queryKey: queryKeys.blogs(companyId, status || undefined),
    queryFn: async () => {
      const qs = new URLSearchParams({ companyId: companyId! });
      if (status) qs.set("status", status);
      const data = await api.get<{ blogs: Blog[] }>(`/api/blogs?${qs.toString()}`);
      return data.blogs;
    },
    enabled: !!companyId,
  });
}

export function useBlog(id: string) {
  return useQuery({
    queryKey: queryKeys.blog(id),
    queryFn: async () => (await api.get<{ blog: Blog }>(`/api/blogs/${id}`)).blog,
    enabled: !!id,
  });
}

function useInvalidateBlogLists() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["blogs"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: (input: CreateBlogInput) =>
      api.post<{ blog: Blog }>("/api/blogs", input).then((d) => d.blog),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(blog.id), blog);
      invalidateLists();
    },
  });
}

export function useUpdateBlog(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: (input: UpdateBlogInput) =>
      api.patch<{ blog: Blog }>(`/api/blogs/${id}`, input).then((d) => d.blog),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      invalidateLists();
    },
  });
}

function useBlogTransition(id: string, action: "submit-review" | "publish" | "unpublish") {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: () => api.post<{ blog: Blog }>(`/api/blogs/${id}/${action}`).then((d) => d.blog),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      invalidateLists();
    },
  });
}

export function useSubmitForReview(id: string) {
  return useBlogTransition(id, "submit-review");
}

export function usePublishBlog(id: string) {
  return useBlogTransition(id, "publish");
}

export function useUnpublishBlog(id: string) {
  return useBlogTransition(id, "unpublish");
}

export function useReviewBlog(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: (input: ReviewActionInput) =>
      api.post<{ blog: Blog }>(`/api/blogs/${id}/review`, input).then((d) => d.blog),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      invalidateLists();
    },
  });
}
