import { apiRequest } from "./client";

export type AuditLog = {
  id: string;
  action: string;
  entity_id: string;
  user_id?: string;
  created_at: string;
};

type UserAuditResponse = {
  id: string;
  email: string;
  Audit_logs: AuditLog[];
};

export async function fetchAdminAuditLogs(params?: {
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

export async function fetchMyAuditLogs() {
  const response = await apiRequest<UserAuditResponse>("/audit-logs/user-audits");
  return {
    ...response,
    data: response.data?.Audit_logs || [],
  };
}

export async function fetchAuditLogsByRole(
  role: string,
  params?: {
    page?: number;
    limit?: number;
    action?: string;
    user_id?: string;
    entity_id?: string;
  }
) {
  if (role.toUpperCase() === "ADMIN") {
    return fetchAdminAuditLogs(params);
  }

  return fetchMyAuditLogs();
}
