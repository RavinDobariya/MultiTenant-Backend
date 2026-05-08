import { apiRequest } from "./client";

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type User = {
  user_id: number;
  email: string;
  role: string;
  company_id: number;
};

export async function login(payload: LoginPayload) {
  return apiRequest<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe() {
  return apiRequest<User>("/me");
}

export async function logout() {
  return apiRequest<null>("/logout", { method: "POST" });
}
