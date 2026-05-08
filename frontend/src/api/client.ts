import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../lib/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type ApiResponse<T> = {
  message?: string;
  data?: T;
  error?: string | null;
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    window.location.href = "/login";
    throw new Error("No refresh token");
  }

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    window.location.href = "/login";
    throw new Error("Refresh failed");
  }

  const payload = await response.json();
  const tokens = payload?.data || payload;
  if (tokens.access_token) {
    saveTokens(tokens);
  } else {
    clearTokens();
    window.location.href = "/login";
    throw new Error("Invalid refresh response");
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — try refresh once
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

    // Retry with new token
    const newToken = getAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
    }

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const retryPayload = await retryResponse.json().catch(() => null);

    if (!retryResponse.ok) {
      const message = retryPayload?.detail || retryPayload?.message || "Request failed";
      throw new Error(message);
    }

    return retryPayload;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}
