"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface AuditLogRow {
  id: string;
  userId: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus?: string;
  comment?: string;
  createdAt: string;
  user?: { id: string; firstName?: string; lastName?: string; email: string; role?: string | null };
  company?: { id: string; name: string };
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditLogsResult {
  logs: AuditLogRow[];
  pagination: AuditLogPagination;
}

type AuditLogsResponse =
  | { status?: number; message?: string; data?: AuditLogRow[]; pagination?: AuditLogPagination }
  | { logs?: AuditLogRow[]; pagination?: AuditLogPagination }
  | AuditLogRow[];

function normalizeAuditLogsResponse(response: AuditLogsResponse, fallbackPage: number, fallbackLimit: number): AuditLogsResult {
  if (Array.isArray(response)) {
    return {
      logs: response,
      pagination: {
        page: fallbackPage,
        limit: fallbackLimit,
        totalItems: response.length,
        totalPages: Math.max(1, Math.ceil(response.length / fallbackLimit)),
      },
    };
  }

  const logs = "data" in response && Array.isArray(response.data)
    ? response.data
    : "logs" in response && Array.isArray(response.logs)
      ? response.logs
      : [];

  return {
    logs,
    pagination: response.pagination ?? {
      page: fallbackPage,
      limit: fallbackLimit,
      totalItems: logs.length,
      totalPages: Math.max(1, Math.ceil(logs.length / fallbackLimit)),
    },
  };
}

export function useAuditLogs(
  companyId: string | null,
  options?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
  }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const entityType = options?.entityType?.trim() || undefined;
  const entityId = options?.entityId?.trim() || undefined;
  const userId = options?.userId?.trim() || undefined;
  const action = options?.action?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.auditLogs(companyId, page, limit, entityType, entityId, userId, action),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (companyId) params.set("companyId", companyId);
      if (entityType) params.set("entityType", entityType);
      if (entityId) params.set("entityId", entityId);
      if (userId) params.set("userId", userId);
      if (action) params.set("action", action);

      const response = await api.get<AuditLogsResponse>(`/api/v1/audit-logs?${params.toString()}`);
      return normalizeAuditLogsResponse(response, page, limit);
    },
    enabled: !!companyId,
  });
}
