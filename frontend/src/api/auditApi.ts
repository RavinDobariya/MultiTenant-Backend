import { apiRequest } from "./client";

export type AuditLog = {
  id: string;
  action: string;
  entity_id: string;
  user_id: string;
  created_at: string;
};

export async function fetchAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  user_id?: string;
  entity_id?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.action) query.set("action", params.action);
  if (params?.user_id) query.set("user_id", params.user_id);
  if (params?.entity_id) query.set("entity_id", params.entity_id);

  const qs = query.toString();
  return apiRequest<AuditLog[]>(`/audit-logs/list${qs ? `?${qs}` : ""}`);
}
