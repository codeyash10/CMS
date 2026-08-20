"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Blog, BlogStatus } from "@/lib/mock-db";
import type { CreateBlogInput, ReviewActionInput, UpdateBlogInput } from "@/lib/schemas/blog";

type BackendBlog = Omit<Blog, "status" | "coverImageUrl" | "coverImageUrls" | "reviews"> & { status: string; coverImageUrl?: string[] | string; coverImageUrls?: string[]; publishedAt?: string | null };
type BackendListResponse = { status: number; message: string; data: BackendBlog[]; pagination?: { page: number; limit: number; totalItems: number; totalPages: number } };
type BackendItemResponse = { status?: number; message?: string; data?: BackendBlog | { blog?: BackendBlog }; blog?: BackendBlog };
export type BlogPagination = { page: number; limit: number; totalItems: number; totalPages: number };
export type PaginatedBlogs = { blogs: Blog[]; pagination: BlogPagination };
const statusMap: Record<string, BlogStatus> = { DRAFT: "draft", SUBMITTED_FOR_REVIEW: "submitted_for_review", APPROVED: "approved", REJECTED: "rejected", PUBLISHED: "published" };
const backendStatusMap: Record<BlogStatus, string> = { draft: "DRAFT", submitted_for_review: "SUBMITTED_FOR_REVIEW", approved: "APPROVED", rejected: "REJECTED", published: "PUBLISHED" };

function normalizeImageUrls(blog: BackendBlog) {
  if (!blog) return [];
  if (Array.isArray(blog.coverImageUrl)) return blog.coverImageUrl;
  if (Array.isArray(blog.coverImageUrls)) return blog.coverImageUrls;
  return blog.coverImageUrl ? [blog.coverImageUrl] : [];
}
function normalizeBlog(blog: (Partial<BackendBlog> & { reviews?: Blog["reviews"] } & { blog?: Partial<BackendBlog> }) | null | undefined): Blog {
  const source = (blog && "blog" in blog && blog.blog ? blog.blog : blog) ?? {};
  const coverImageUrls = normalizeImageUrls(source as BackendBlog);
  const statusKey = String((source as Partial<BackendBlog>).status ?? "draft").toUpperCase();
  return {
    ...(source as Blog),
    status: statusMap[statusKey] ?? "draft",
    coverImageUrls,
    coverImageUrl: coverImageUrls[0],
    tags: (source as Partial<BackendBlog>).tags ?? [],
    reviews: (source as Partial<Blog>).reviews ?? [],
  };
}
function getResponseBlog(response: BackendItemResponse) {
  const payload = response.data ?? response.blog;
  if (!payload) throw new Error("The review was saved, but the backend did not return the updated blog.");
  return normalizeBlog(payload);
}
function toBackendPayload(input: CreateBlogInput | UpdateBlogInput) { const payload = { ...input }; delete payload.categoryId; delete payload.tags; return payload; }
function useInvalidateBlogLists() { const queryClient = useQueryClient(); return () => { queryClient.invalidateQueries({ queryKey: ["blogs"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); queryClient.invalidateQueries({ queryKey: ["audit-logs"] }); }; }
function replaceBlogInLists(queryClient: ReturnType<typeof useQueryClient>, blog: Blog) {
  queryClient.getQueriesData<Blog[]>({ queryKey: ["blogs"] }).forEach(([key, current]) => {
    const status = key[2] as BlogStatus | undefined;
    const next = (current ?? []).map((item) => item.id === blog.id ? blog : item).filter((item) => !status || item.status === status);
    queryClient.setQueryData(key, next);
  });
}

export function useBlogs(companyId: string | null, status?: BlogStatus | "") {
  return useQuery({ queryKey: queryKeys.blogs(companyId, status || undefined), queryFn: async () => { const response = await api.get<BackendListResponse>("/api/v1/blogs"); return response.data.map(normalizeBlog).filter((blog) => (!companyId || blog.companyId === companyId) && (!status || blog.status === status)); }, enabled: Boolean(companyId) });
}

export function usePaginatedBlogs(companyId: string | null, status: BlogStatus | "", page: number, limit = 10) {
  return useQuery({
    queryKey: queryKeys.paginatedBlogs(companyId, status || undefined, page, limit),
    queryFn: async (): Promise<PaginatedBlogs> => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (companyId) params.set("companyId", companyId);
      if (status) params.set("status", backendStatusMap[status]);
      const response = await api.get<BackendListResponse>(`/api/v1/blogs?${params.toString()}`);
      const blogs = response.data.map(normalizeBlog);
      return {
        blogs,
        pagination: response.pagination ?? { page, limit, totalItems: blogs.length, totalPages: 1 },
      };
    },
    enabled: Boolean(companyId),
  });
}

export function useBlog(id: string) {
  return useQuery({ queryKey: queryKeys.blog(id), queryFn: async () => { const response = await api.get<BackendListResponse>("/api/v1/blogs"); const blog = response.data.find((item) => item.id === id); if (!blog) throw new Error("Blog not found."); return normalizeBlog(blog); }, enabled: Boolean(id) });
}

export function useCreateBlog() {
  const queryClient = useQueryClient(); const invalidateLists = useInvalidateBlogLists();
  return useMutation({ mutationFn: async (input: CreateBlogInput) => getResponseBlog(await api.post<BackendItemResponse>("/api/v1/blogs", toBackendPayload(input))), onSuccess: (blog) => { queryClient.setQueryData(queryKeys.blog(blog.id), blog); invalidateLists(); } });
}

export function useUpdateBlog(id: string) {
  const queryClient = useQueryClient(); const invalidateLists = useInvalidateBlogLists();
  return useMutation({ mutationFn: async (input: UpdateBlogInput) => getResponseBlog(await api.patch<BackendItemResponse>(`/api/v1/blogs/${id}`, toBackendPayload(input))), onSuccess: (blog) => { queryClient.setQueryData(queryKeys.blog(id), blog); invalidateLists(); } });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient(); const invalidateLists = useInvalidateBlogLists();
  return useMutation({ mutationFn: (id: string) => api.delete<{ status: number; message: string; data: { id: string; deleted: boolean } }>(`/api/v1/blogs/${id}`), onSuccess: (_result, id) => { queryClient.removeQueries({ queryKey: queryKeys.blog(id) }); queryClient.setQueriesData<Blog[]>({ queryKey: ["blogs"] }, (current) => current?.filter((item) => item.id !== id)); invalidateLists(); } });
}

function useBlogTransition(id: string, action: "submit-review" | "publish" | "unpublish") {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();

  return useMutation({
    mutationFn: async () =>
      getResponseBlog(await api.post<BackendItemResponse>(`/api/v1/blogs/${id}/${action}`)),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      replaceBlogInLists(queryClient, blog);
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
    mutationFn: async (input: ReviewActionInput) =>
      getResponseBlog(await api.post<BackendItemResponse>(`/api/v1/blogs/${id}/review`, input)),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      replaceBlogInLists(queryClient, blog);
      invalidateLists();
    },
  });
}
