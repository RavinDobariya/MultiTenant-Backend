import { apiRequest } from "./client";

export type Unit = {
  id: string;
  name: string;
  is_archived: number;
  company_id: string;
};

export async function fetchUnits() {
  return apiRequest<Unit[]>("/units");
}
