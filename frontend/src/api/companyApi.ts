import { apiRequest } from "./client";

export type Company = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export async function fetchMyCompany() {
  return apiRequest<Company>("/companies/get-your-company");
}
