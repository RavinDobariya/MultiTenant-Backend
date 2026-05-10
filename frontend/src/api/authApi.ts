import { apiRequest } from "./client";

export type LoginPayload = {
  email: string;
  password: string;
};

export type CompanyAdminSignupPayload = {
  company_name: string;
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type User = {
  user_id: string;
  email: string;
  role: string;
  company_id: string;
};

export async function signupCompany(payload: CompanyAdminSignupPayload) {
  return apiRequest<{
    company_id: string;
    company_name: string;
    admin_user_id: string;
    email: string;
    role: string;
  }>("/signup-company", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

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

export async function deleteMyAccount(confirm = true) {
  return apiRequest<{ message?: string }>(`/delete?confirm=${String(confirm)}`, {
    method: "DELETE",
  });
}
