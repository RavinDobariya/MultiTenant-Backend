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

export type UnitDetail = {
  id: string;
  name: string;
  Documents: Array<{
    id: string;
    title: string;
    type: string;
  }>;
};

export async function fetchUnitById(unitId: string) {
  return apiRequest<UnitDetail>(`/units/${unitId}`);
}

export async function createUnit(payload: { name: string }) {
  return apiRequest<{ unit_id: string }>("/units", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUnit(unitId: string, payload: { name: string }) {
  return apiRequest<null>(`/units/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function archiveUnit(unitId: string, cascade = false) {
  return apiRequest<null>(`/units/${unitId}/archive?cascade=${String(cascade)}`, {
    method: "PATCH",
  });
}

export async function unarchiveUnit(unitId: string) {
  return apiRequest<null>(`/units/${unitId}/unarchive`, {
    method: "PATCH",
  });
}

export async function deleteUnit(unitId: string, confirm = true) {
  return apiRequest<null>(`/units/${unitId}?confirm=${String(confirm)}`, {
    method: "DELETE",
  });
}
