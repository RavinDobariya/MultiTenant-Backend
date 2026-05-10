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
