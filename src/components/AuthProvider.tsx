"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "@/lib/auth-api";
import { queryKeys } from "@/lib/queryKeys";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "admin" | "editor" | "reviewer" | "super_admin";
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentUserQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.getCurrentUser(),
    retry: false,
  });

  const user = currentUserQuery.data ?? null;
  const loading = currentUserQuery.isLoading;
  const resolvedActiveCompanyId =
    activeCompanyId ?? user?.companies[0]?.id ?? null;

  const loginMutation = useMutation({
    mutationFn: (input: { email: string; password: string }) => {
      const parsed = loginSchema.parse(input);
      return authApi.login(parsed);
    },
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(queryKeys.me, loggedInUser);
      setActiveCompanyId(loggedInUser.companies[0]?.id ?? null);
      router.push("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: "admin" | "editor" | "reviewer" | "super_admin";
    }) => {
      const parsed = registerSchema.parse(input);
      return authApi.register(parsed);
    },
    onSuccess: (registeredUser) => {
      queryClient.setQueryData(queryKeys.me, registeredUser);
      setActiveCompanyId(registeredUser.companies[0]?.id ?? null);
      router.push("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      router.push("/login");
    },
  });

  const login = useCallback(
    (email: string, password: string) =>
      loginMutation.mutateAsync({ email, password }).then(() => {}),
    [loginMutation],
  );

  const register = useCallback(
    (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: "admin" | "editor" | "reviewer" | "super_admin";
    }) => registerMutation.mutateAsync(input).then(() => {}),
    [registerMutation],
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync().then(() => {}),
    [logoutMutation],
  );

  const refresh = useCallback(async () => {
    await currentUserQuery.refetch();
  }, [currentUserQuery]);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      activeCompanyId: resolvedActiveCompanyId,
      setActiveCompanyId,
      hasPermission,
      login,
      register,
      logout,
      refresh,
    }),
    [
      user,
      loading,
      resolvedActiveCompanyId,
      hasPermission,
      login,
      register,
      logout,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
