import { apiRequest } from "./client";
import { getAccessToken } from "../lib/authStorage";

export type Document = {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  type: "POLICY" | "MANUAL" | "REPORT";
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  file_url: string | null;
  created_by: string;
  created_at: string;
  approved_by: string | null;
  updated_at: string;
  is_archived: number;
  archived_at: string | null;
};

export type DocumentListResponse = {
  page: number;
  limit: number;
  "total results": number;
  sort_by: string;
  sort_order: string;
  data: Document[];
};

export type DocumentUpdatePayload = {
  title?: string;
  description?: string;
  type?: "POLICY" | "MANUAL" | "REPORT";
};

export async function fetchDocuments(params?: {
  page?: number;
  limit?: number;
  unit_id?: string;
  status?: string;
  type?: string;
  sort_by?: string;
  sort_order?: string;
  archived_docs?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.unit_id) query.set("unit_id", params.unit_id);
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  if (params?.sort_order) query.set("sort_order", params.sort_order);
  if (params?.archived_docs !== undefined) query.set("archived_docs", String(params.archived_docs));

  const qs = query.toString();
  return apiRequest<DocumentListResponse>(`/documents/list${qs ? `?${qs}` : ""}`);
}

export type DocumentCreatePayload = {
  unit_id: string;
  title: string;
  description?: string;
  type: "POLICY" | "MANUAL" | "REPORT";
};

export async function createDocument(payload: DocumentCreatePayload) {
  return apiRequest<string>("/documents/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchDocumentById(documentId: string) {
  return apiRequest<Document>(`/documents/${documentId}`);
}

export async function updateDocumentMetadata(
  documentId: string,
  payload: DocumentUpdatePayload
) {
  return apiRequest<string>(`/documents/${documentId}?action=METADATA`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function approveDocument(documentId: string) {
  return apiRequest<string>(`/documents/${documentId}/approve`, {
    method: "PATCH",
  });
}

export async function archiveDocument(documentId: string) {
  return apiRequest<string>(`/documents/${documentId}/archive`, {
    method: "PATCH",
  });
}

export async function downloadDocumentFile(documentId: string) {
  const token = getAccessToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  const response = await fetch(
    `${baseUrl}/documents/download?document_id=${encodeURIComponent(documentId)}&downloadType=PDF`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  return response.blob();
}

export async function uploadDocumentFile(documentId: string, file: File) {
  const token = getAccessToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${baseUrl}/documents/upload/${documentId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail || payload?.message || "Failed to upload file";
    throw new Error(message);
  }

  return payload;
}

export async function deleteDocument(documentId: string, confirm = true) {
  return apiRequest<string>(`/documents/delete/${documentId}?confirm=${String(confirm)}`, {
    method: "DELETE",
  });
}
