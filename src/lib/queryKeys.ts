export const queryKeys = {
  me: ["me"] as const,
  blogs: (companyId?: string | null, status?: string) => ["blogs", companyId, status] as const,
  blog: (id: string) => ["blog", id] as const,
  dashboardSummary: (companyId?: string | null) => ["dashboard-summary", companyId] as const,
  users: ["users"] as const,
  auditLogs: (companyId?: string | null) => ["audit-logs", companyId] as const,
};
