"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { loginSchema } from "@/lib/schemas/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: { id: string; key: string; label: string } | null;
  permissions: string[];
  companyIds: string[];
  companies: { id: string; name: string; slug: string }[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<{ user: AuthUser }>("/api/auth/me").then((d) => d.user),
    retry: false,
  });

  const user = meQuery.data ?? null;
  const loading = meQuery.isLoading;

  useEffect(() => {
    if (user) setActiveCompanyId((prev) => prev ?? user.companies[0]?.id ?? null);
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: (input: { email: string; password: string }) => {
      const parsed = loginSchema.parse(input);
      return api.post<{ user: AuthUser }>("/api/auth/login", parsed).then((d) => d.user);
    },
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(queryKeys.me, loggedInUser);
      setActiveCompanyId(loggedInUser.companies[0]?.id ?? null);
      router.push("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      router.push("/login");
    },
  });

  const login = useCallback(
    (email: string, password: string) => loginMutation.mutateAsync({ email, password }).then(() => {}),
    [loginMutation]
  );

  const logout = useCallback(() => logoutMutation.mutateAsync().then(() => {}), [logoutMutation]);

  const refresh = useCallback(async () => {
    await meQuery.refetch();
  }, [meQuery]);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, activeCompanyId, setActiveCompanyId, hasPermission, login, logout, refresh }),
    [user, loading, activeCompanyId, hasPermission, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
