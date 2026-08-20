export const queryKeys = {
  me: ["me"] as const,
  blogs: (companyId?: string | null, status?: string) => ["blogs", companyId, status] as const,
  paginatedBlogs: (companyId?: string | null, status?: string, page = 1, limit = 10) => ["blogs", "paginated", companyId, status, page, limit] as const,
  blog: (id: string) => ["blog", id] as const,
  dashboardSummary: (companyId?: string | null) => ["dashboard-summary", companyId] as const,
  users: ["users"] as const,
  auditLogs: (companyId?: string | null) => ["audit-logs", companyId] as const,
};
