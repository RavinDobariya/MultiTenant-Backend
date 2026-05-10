import { apiRequest } from "./client";

export type CompanyUser = {
  id: string;
  email: string;
};

export type CompanyUnitSummary = {
  id: string;
  name: string;
};

export type Company = {
  id: string;
  name: string;
  users: CompanyUser[];
  units: CompanyUnitSummary[];
};

export type DiscoveredCompany = {
  name: string;
};

export type JoinRequest = {
  id: string;
  company_id: string;
  company_name?: string;
  email: string;
  requested_role: "admin" | "editor" | "user";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  approved_user_id?: string | null;
  reviewed_by_email?: string | null;
};

type RawCompanyResponse = {
  "company id": string;
  "company name": string;
  "company users": CompanyUser[];
  "company units": CompanyUnitSummary[];
};

function normalizeCompany(raw: RawCompanyResponse): Company {
  return {
    id: raw["company id"],
    name: raw["company name"],
    users: raw["company users"] || [],
    units: raw["company units"] || [],
  };
}

export async function fetchMyCompany() {
  const response = await apiRequest<RawCompanyResponse>("/companies/get-your-company");
  return {
    ...response,
    data: response.data ? normalizeCompany(response.data) : undefined,
  };
}

export async function updateCompany(payload: { name: string }) {
  return apiRequest<null>("/companies/update", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCompany(confirm = true) {
  return apiRequest<string>(`/companies/delete?confirm=${String(confirm)}`, {
    method: "DELETE",
  });
}

export async function discoverCompanies(query: string) {
  const suffix = query.trim()
    ? `?query=${encodeURIComponent(query.trim())}`
    : "";
  return apiRequest<DiscoveredCompany[]>(`/companies/discover${suffix}`);
}

export async function createJoinRequest(payload: {
  company_name: string;
  email: string;
  password: string;
  requested_role: "admin" | "editor" | "user";
}) {
  return apiRequest<JoinRequest>("/join-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchJoinRequests() {
  return apiRequest<JoinRequest[]>("/join-requests");
}

export async function approveJoinRequest(requestId: string, role?: "admin" | "editor" | "user") {
  return apiRequest<{ join_request_id: string; user_id: string; role: string; status: string }>(
    `/join-requests/${requestId}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
  );
}

export async function rejectJoinRequest(requestId: string, rejection_reason?: string) {
  return apiRequest<{ join_request_id: string; status: string }>(
    `/join-requests/${requestId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ rejection_reason }),
    }
  );
}
