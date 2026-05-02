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

export async function login(payload: LoginPayload) {
  return apiRequest<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
