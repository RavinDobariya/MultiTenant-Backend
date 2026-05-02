const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type ApiResponse<T> = {
  message?: string;
  data?: T;
  error?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}
