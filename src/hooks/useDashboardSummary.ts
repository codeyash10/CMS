"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface DashboardSummary {
  draftCount: number;
  pendingReviewCount: number;
  pendingPublishCount: number;
  recentlyPublished: { id: string; title: string; publishedAt?: string }[];
  recentActivity: {
    id: string;
    action: string;
    createdAt: string;
    entityId: string;
  }[];
}

export function useDashboardSummary(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(companyId),
    queryFn: () =>
      api.get<DashboardSummary>(
        `/api/dashboard/summary?companyId=${companyId}`,
      ),
    enabled: !!companyId,
  });
}
