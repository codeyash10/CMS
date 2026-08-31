/**
 * Thin fetch wrapper. Every call goes through here so that, later, pointing
 * the app at a real backend is a one-line change (base URL + removing
 * credentials: "include" if the real backend uses bearer tokens instead of
 * cookies).
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const AUTH_STORAGE_KEYS = {
  accessToken: "cms_access_token",
  refreshToken: "cms_refresh_token",
} as const;

/**
 * Leave this unset to use the in-app mock routes during development.
 * Set NEXT_PUBLIC_API_BASE_URL when the backend is available; all API calls
 * will then use that host without changing individual screens or hooks.
 */
function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw === undefined || raw === "") return "";
  if (!/^https?:\/\//.test(raw)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_BASE_URL "${raw}": must be a full http(s) URL.`,
    );
  }
  return raw.replace(/\/$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
}

export function setStoredAuthTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, tokens.refreshToken);
  }
}

export function clearStoredAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
}

const REFRESH_PATH = "/api/v1/auth/refresh";

function resolveApiUrl(path: string) {
  return API_BASE_URL && path.startsWith("/api/v1")
    ? `${API_BASE_URL}${path}`
    : path;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  const isBackendRequest = Boolean(API_BASE_URL);
  const res = await fetch(resolveApiUrl(REFRESH_PATH), {
    method: "POST",
    credentials: isBackendRequest ? "omit" : "include",
    headers: {
      "Content-Type": "application/json",
      ...(isBackendRequest ? { "ngrok-skip-browser-warning": "true" } : {}),
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!res.ok) {
    clearStoredAuthTokens();
    return null;
  }

  const body = await res.json().catch(() => null);
  if (!body?.data?.accessToken) {
    clearStoredAuthTokens();
    return null;
  }

  setStoredAuthTokens(body.data);
  return body.data.accessToken as string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const accessToken = getStoredAccessToken();
  const isBackendRequest = Boolean(API_BASE_URL) && path.startsWith("/api/v1");
  const res = await fetch(resolveApiUrl(path), {
    ...options,
    credentials: isBackendRequest ? "omit" : "include",
    headers: {
      "Content-Type": "application/json",
      ...(isBackendRequest ? { "ngrok-skip-browser-warning": "true" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (
    res.status === 401 &&
    !isRetry &&
    path !== REFRESH_PATH &&
    getStoredRefreshToken()
  ) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return request<T>(path, options, true);
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      body?.errors?.[0] ??
        body?.message ??
        body?.error ??
        `Request failed with status ${res.status}`,
      res.status,
    );
  }

  if (!isJson) {
    throw new ApiError("Expected JSON response from the backend.", res.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
