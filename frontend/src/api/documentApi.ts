import { apiBlobRequest, apiRequest } from "./client";

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
  return apiBlobRequest(
    `/documents/download?document_id=${encodeURIComponent(documentId)}&downloadType=PDF`
  );
}

export async function uploadDocumentFile(documentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<null>(`/documents/upload/${documentId}`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteDocument(documentId: string, confirm = true) {
  return apiRequest<string>(`/documents/delete/${documentId}?confirm=${String(confirm)}`, {
    method: "DELETE",
  });
}
