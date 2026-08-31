"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface AuditLogRow {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  fromStatus?: string;
  toStatus?: string;
  comment?: string;
  createdAt: string;
}

export function useAuditLogs(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.auditLogs(companyId),
    queryFn: async () =>
      (
        await api.get<{ logs: AuditLogRow[] }>(
          `/api/audit-logs?companyId=${companyId}`,
        )
      ).logs,
    enabled: !!companyId,
  });
}
