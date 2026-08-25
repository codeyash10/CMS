"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface CompanyRow {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

type CompaniesResponse =
  | { message?: string; data?: CompanyRow[]; companies?: CompanyRow[] }
  | CompanyRow[];

function normalizeCompaniesResponse(response: CompaniesResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.companies)) return response.companies;
  return [];
}

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: async () => normalizeCompaniesResponse(await api.get<CompaniesResponse>("/api/v1/companies")),
  });
}
