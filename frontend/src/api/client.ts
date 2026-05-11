import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../lib/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type ApiResponse<T> = {
  message?: string;
  data?: T;
  error?: string | null;
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

function redirectToLogin() {
  window.location.href = "/login";
}

function shouldSetJsonContentType(body: BodyInit | null | undefined) {
  return body !== undefined && body !== null && !(body instanceof FormData);
}

function buildHeaders(options: RequestInit, token?: string): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && shouldSetJsonContentType(options.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    redirectToLogin();
    throw new Error("No refresh token");
  }

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    redirectToLogin();
    throw new Error("Refresh failed");
  }

  const payload = await response.json();
  const tokens = payload?.data || payload;
  if (tokens.access_token) {
    saveTokens(tokens);
  } else {
    clearTokens();
    redirectToLogin();
    throw new Error("Invalid refresh response");
  }
}

async function executeRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options, token || undefined),
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
    } catch {
      throw new Error("Session expired. Please log in again.");
    }

    const newToken = getAccessToken();
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: buildHeaders(options, newToken || undefined),
    });
  }

  return response;
}

async function parseResponsePayload(response: Response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  if (contentType.startsWith("text/")) {
    return response.text().catch(() => null);
  }

  return null;
}

function normalizeResponse<T>(payload: unknown, response: Response): ApiResponse<T> {
  if (
    payload &&
    typeof payload === "object" &&
    ("data" in payload || "message" in payload || "error" in payload)
  ) {
    return payload as ApiResponse<T>;
  }

  return {
    message: response.ok ? response.statusText || "Success" : undefined,
    data: payload as T,
    error: null,
  };
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail;
    }
    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
    if ("error" in payload && typeof payload.error === "string") {
      return payload.error;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return "Request failed";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await executeRequest(path, options);
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return normalizeResponse<T>(payload, response);
}

export async function apiBlobRequest(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await executeRequest(path, options);

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw new Error(getErrorMessage(payload));
  }

  return response.blob();
}
