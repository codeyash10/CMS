import {
  ApiError,
  api,
  clearStoredAuthTokens,
  getStoredRefreshToken,
  setStoredAuthTokens,
} from "@/lib/api";

type BackendRole =
  "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "REVIEWER" | "USER" | string;

type AuthResponse = {
  status: number;
  message: string;
  data: {
    userId: string;
    email: string;
    role: BackendRole;
    accessToken: string;
    refreshToken: string;
  };
};

type CurrentUserResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status?: string;
    role: BackendRole;
  };
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  firstName: string;
  lastName: string;
  role?: "admin" | "editor" | "reviewer" | "super_admin";
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: { id: string; key: string; label: string } | null;
  permissions: string[];
  companyIds: string[];
  companies: { id: string; name: string; slug: string }[];
};

type MessageResponse = {
  status: number;
  message: string;
  data: { message: string };
};

const DEFAULT_COMPANY = {
  id: "co_crediple",
  name: "Crediple",
  slug: "crediple",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  REVIEWER: "Reviewer",
  USER: "User",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "blog.create",
    "blog.edit_own",
    "blog.edit_any",
    "blog.submit_review",
    "blog.review",
    "blog.publish",
    "blog.delete",
    "user.manage",
    "company.manage",
    "audit.view_all",
    "audit.view_company",
  ],
  ADMIN: [
    "blog.create",
    "blog.edit_own",
    "blog.edit_any",
    "blog.submit_review",
    "blog.review",
    "blog.publish",
    "blog.delete",
    "user.manage",
    "audit.view_company",
  ],
  EDITOR: ["blog.create", "blog.edit_own", "blog.submit_review"],
  REVIEWER: ["blog.review", "audit.view_company"],
  USER: [],
};

function normalizeRole(role: BackendRole) {
  const key = String(role).toUpperCase();
  return {
    id: key.toLowerCase(),
    key: key.toLowerCase(),
    label: ROLE_LABELS[key] ?? key,
  };
}

function toAuthUser(data: CurrentUserResponse["data"]): AuthUser {
  const role = normalizeRole(data.role);
  const name =
    [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
    data.email;

  return {
    id: data.id,
    name,
    email: data.email,
    role,
    permissions: ROLE_PERMISSIONS[String(data.role).toUpperCase()] ?? [],
    companyIds: [DEFAULT_COMPANY.id],
    companies: [DEFAULT_COMPANY],
  };
}

async function authenticate(
  path: "/api/v1/auth/login" | "/api/v1/auth/register",
  input: LoginInput | RegisterInput,
) {
  const response = await api.post<AuthResponse>(path, input);
  setStoredAuthTokens(response.data);
  return authApi.getCurrentUser();
}

export const authApi = {
  login(input: LoginInput) {
    return authenticate("/api/v1/auth/login", input);
  },
  register(input: RegisterInput) {
    return authenticate("/api/v1/auth/register", input);
  },
  async getCurrentUser() {
    try {
      return await this.fetchCurrentUser();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
      if (!getStoredRefreshToken()) {
        clearStoredAuthTokens();
        throw error;
      }
      try {
        await this.refresh();
        return await this.fetchCurrentUser();
      } catch (refreshError) {
        clearStoredAuthTokens();
        throw refreshError;
      }
    }
  },
  async fetchCurrentUser() {
    const response = await api.get<CurrentUserResponse>("/api/v1/users/me");
    return toAuthUser(response.data);
  },
  async refresh() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken)
      throw new Error("Your session has expired. Please sign in again.");

    try {
      const response = await api.post<AuthResponse>(
        "/api/v1/auth/refresh",
        undefined,
        {
          Authorization: `Bearer ${refreshToken}`,
        },
      );
      setStoredAuthTokens(response.data);
    } catch (error) {
      clearStoredAuthTokens();
      throw error;
    }
  },
  forgotPassword(email: string) {
    return api.post<MessageResponse>("/api/v1/auth/forgot-password", { email });
  },
  resetPassword(input: { email: string; otp: string; newPassword: string }) {
    return api.post<MessageResponse>("/api/v1/auth/reset-password", input);
  },
  changePassword(input: { oldPassword: string; newPassword: string }) {
    return api.post<MessageResponse>("/api/v1/auth/change-password", input);
  },
  async logout() {
    try {
      await api.post("/api/v1/auth/logout", {});
    } catch {
      // A missing or expired token should still complete a local logout.
    } finally {
      clearStoredAuthTokens();
    }
  },
};
