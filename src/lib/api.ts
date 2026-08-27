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
 * Leave this blank to use the in-app mock routes during development.
 * Set NEXT_PUBLIC_API_BASE_URL when the backend is available; all API calls
 * will then use that host without changing individual screens or hooks.
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
}

export function setStoredAuthTokens(tokens: { accessToken: string; refreshToken?: string }) {
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

function resolveApiUrl(path: string) {
  return API_BASE_URL && path.startsWith("/api/v1") ? `${API_BASE_URL}${path}` : path;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refreshes the access token using the stored refresh token. De-duped so concurrent 401s only trigger one refresh call. */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;
    try {
      const url = resolveApiUrl("/api/v1/auth/refresh");
      const isBackendRequest = url.startsWith("http://") || url.startsWith("https://");
      const res = await fetch(url, {
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
        return false;
      }
      const body = await res.json().catch(() => null);
      const accessToken = body?.data?.accessToken;
      if (!accessToken) {
        clearStoredAuthTokens();
        return false;
      }
      setStoredAuthTokens({ accessToken, refreshToken: body?.data?.refreshToken });
      return true;
    } catch {
      clearStoredAuthTokens();
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const accessToken = getStoredAccessToken();
  const url = resolveApiUrl(path);
  const isBackendRequest = url.startsWith("http://") || url.startsWith("https://");
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    credentials: isBackendRequest ? "omit" : "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(isBackendRequest ? { "ngrok-skip-browser-warning": "true" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // An expired access token surfaces as a 401 well after login ("unauthorized
  // after some time"). Refresh once and retry, instead of failing outright —
  // but never for the auth endpoints themselves (would loop / isn't a stale-token case).
  if (res.status === 401 && !isRetry && !path.startsWith("/api/v1/auth/") && getStoredRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, true);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      body?.errors?.[0] ?? body?.message ?? body?.error ?? `Request failed with status ${res.status}`,
      res.status
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
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined, headers }),
  postForm: <T>(path: string, data: FormData) =>
    request<T>(path, { method: "POST", body: data }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
