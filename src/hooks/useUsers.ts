"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { label: string } | null;
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () =>
      (await api.get<{ users: UserRow[] }>("/api/users")).users,
  });
}
