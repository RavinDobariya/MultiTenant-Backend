import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FilePlus2,
  X,
  Upload,
  CheckCircle2,
  Archive,
  Trash2,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  approveDocument,
  archiveDocument,
  createDocument,
  deleteDocument,
  downloadDocumentFile,
  fetchDocuments,
  uploadDocumentFile,
  type Document,
} from "../../api/documentApi";
import { fetchUnits, type Unit } from "../../api/unitApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["", "DRAFT", "APPROVED", "ARCHIVED"];
const TYPE_OPTIONS = ["", "POLICY", "MANUAL", "REPORT"] as const;

export default function DocumentsPage() {
  const { user } = useAuth();
  const role = (user?.role || "user").toUpperCase();
  const canEdit = role === "ADMIN" || role === "EDITOR";
  const isAdmin = role === "ADMIN";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<"POLICY" | "MANUAL" | "REPORT">("POLICY");
  const [createUnitId, setCreateUnitId] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchDocuments({
        page,
        limit: PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(unitFilter ? { unit_id: unitFilter } : {}),
        ...(showArchived ? { archived_docs: true } : {}),
      });
      const payload = res.data;
      if (payload) {
        setDocuments(payload.data || []);
        setTotalResults(payload["total results"] || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, statusFilter, typeFilter, unitFilter, showArchived]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    fetchUnits()
      .then((res) => {
        const rows = res.data || [];
        setUnits(rows);
        if (!createUnitId) {
          const firstActive = rows.find((unit) => !unit.is_archived);
          if (firstActive) setCreateUnitId(firstActive.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!notice && !error) return;

    const timeoutId = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notice, error]);

  function resetFilters() {
    setPage(1);
    setStatusFilter("");
    setTypeFilter("");
    setUnitFilter("");
    setShowArchived(false);
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createUnitId || !createTitle.trim()) return;

    setSubmittingCreate(true);
    setError("");
    setNotice("");

    try {
      await createDocument({
        unit_id: createUnitId,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        type: createType,
      });
      setCreateTitle("");
      setCreateDescription("");
      setCreateType("POLICY");
      setCreateOpen(false);
      setNotice("Document created.");
      setPage(1);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleApprove(documentId: string) {
    setActionLoading(`approve:${documentId}`);
    setError("");
    setNotice("");
    try {
      await approveDocument(documentId);
      setNotice("Document approved.");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive(documentId: string) {
    setActionLoading(`archive:${documentId}`);
    setError("");
    setNotice("");
    try {
      await archiveDocument(documentId);
      setNotice("Document archived.");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(documentId: string) {
    const confirmed = window.confirm(
      "Delete this document permanently? This will remove related data and cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading(`delete:${documentId}`);
    setError("");
    setNotice("");
    try {
      await deleteDocument(documentId, true);
      setNotice("Document deleted.");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownload(documentId: string) {
    setActionLoading(`download:${documentId}`);
    setError("");
    try {
      const blob = await downloadDocumentFile(documentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpload(documentId: string, file: File | null) {
    if (!file) return;

    setActionLoading(`upload:${documentId}`);
    setError("");
    setNotice("");
    try {
      await uploadDocumentFile(documentId, file);
      setNotice("File uploaded.");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setActionLoading(null);
      const input = fileInputsRef.current[documentId];
      if (input) input.value = "";
    }
  }

  const hasActiveFilters = statusFilter || typeFilter || unitFilter || showArchived;

  return (
    <div className="docs-page">
      <div className="docs-header">
        <div>
          <h1>Documents</h1>
          <p>
            {loading
              ? "Loading..."
              : `${totalResults} document${totalResults !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <div className="docs-header-actions">
          <button
            className={`docs-filter-toggle ${filtersOpen || hasActiveFilters ? "active" : ""}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
          {canEdit && (
            <button
              className="docs-create-btn"
              onClick={() => setCreateOpen((prev) => !prev)}
            >
              <FilePlus2 size={16} />
              New Document
            </button>
          )}
        </div>
      </div>

      {createOpen && canEdit ? (
        <section className="docs-create-panel">
          <div className="units-panel-head compact">
            <h2>Create Document</h2>
          </div>
          <form className="docs-create-form" onSubmit={handleCreateDocument}>
            <label>
              <span>Title</span>
              <input
                type="text"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Unit</span>
              <select
                value={createUnitId}
                onChange={(event) => setCreateUnitId(event.target.value)}
                required
              >
                <option value="">Select unit</option>
                {units
                  .filter((unit) => !unit.is_archived)
                  .map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={createType}
                onChange={(event) =>
                  setCreateType(event.target.value as "POLICY" | "MANUAL" | "REPORT")
                }
              >
                {TYPE_OPTIONS.filter(Boolean).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="docs-create-wide">
              <span>Description</span>
              <textarea
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                rows={4}
              />
            </label>

            <div className="docs-create-actions">
              <button
                type="button"
                className="doc-detail-btn secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button className="doc-detail-btn primary" type="submit" disabled={submittingCreate}>
                {submittingCreate ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <FilePlus2 size={16} />
                )}
                Create
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {filtersOpen && (
        <div className="docs-filters">
          <div className="docs-filter-group">
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {TYPE_OPTIONS.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Unit</span>
              <select
                value={unitFilter}
                onChange={(e) => {
                  setUnitFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Units</option>
                {units
                  .filter((u) => !u.is_archived)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => {
                  setShowArchived(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Show archived</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button className="docs-filter-clear" onClick={resetFilters}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      )}

      {error && <div className="docs-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      <div className="docs-table-wrap">
        {loading ? (
          <div className="docs-loading">
            <Loader2 size={24} className="spin" />
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="docs-empty">
            <FileText size={40} />
            <h3>No documents found</h3>
            <p>
              {hasActiveFilters
                ? "Try adjusting your filters or clearing them."
                : "Create your first document to get started."}
            </p>
            {hasActiveFilters && (
              <button className="docs-filter-clear" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="docs-table">
              <div className="docs-table-head docs-table-head-actions">
                <button className="docs-th sortable" onClick={() => toggleSort("title")}>
                  Title
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "title" ? "sort-active" : ""}
                  />
                </button>
                <button className="docs-th sortable" onClick={() => toggleSort("type")}>
                  Type
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "type" ? "sort-active" : ""}
                  />
                </button>
                <button className="docs-th sortable" onClick={() => toggleSort("status")}>
                  Status
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "status" ? "sort-active" : ""}
                  />
                </button>
                <span className="docs-th">Unit</span>
                <button className="docs-th sortable" onClick={() => toggleSort("updated_at")}>
                  Updated
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "updated_at" ? "sort-active" : ""}
                  />
                </button>
                <span className="docs-th">Actions</span>
              </div>

              {documents.map((doc) => {
                const unit = units.find((u) => u.id === doc.unit_id);
                const uploadLoading = actionLoading === `upload:${doc.id}`;
                const approveLoading = actionLoading === `approve:${doc.id}`;
                const archiveLoading = actionLoading === `archive:${doc.id}`;
                const deleteLoading = actionLoading === `delete:${doc.id}`;
                const downloadLoading = actionLoading === `download:${doc.id}`;

                return (
                  <div key={doc.id} className="docs-table-row docs-table-row-actions">
                    <Link to={`/app/documents/${doc.id}`} className="doc-cell-title docs-row-link">
                      {doc.file_url && <FileText size={14} className="doc-file-icon" />}
                      {doc.title}
                    </Link>
                    <span className="doc-cell-type">{doc.type}</span>
                    <span>
                      <span className={`status ${doc.status.toLowerCase()}`}>{doc.status}</span>
                    </span>
                    <span className="doc-cell-unit">{unit?.name || doc.unit_id.slice(0, 8)}</span>
                    <span className="doc-cell-date">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                    <div className="docs-row-actions">
                      <Link to={`/app/documents/${doc.id}`} className="docs-icon-btn" title="View">
                        <Eye size={14} />
                      </Link>

                      {doc.file_url ? (
                        <button
                          className="docs-icon-btn"
                          title="Download"
                          onClick={() => handleDownload(doc.id)}
                          disabled={downloadLoading}
                        >
                          {downloadLoading ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                        </button>
                      ) : null}

                      {canEdit ? (
                        <>
                          <input
                            ref={(node) => {
                              fileInputsRef.current[doc.id] = node;
                            }}
                            className="docs-hidden-file"
                            type="file"
                            accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={(event) =>
                              handleUpload(doc.id, event.target.files?.[0] || null)
                            }
                          />
                          <button
                            className="docs-icon-btn"
                            title="Upload file"
                            onClick={() => fileInputsRef.current[doc.id]?.click()}
                            disabled={uploadLoading}
                          >
                            {uploadLoading ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                          </button>
                        </>
                      ) : null}

                      {isAdmin && doc.status !== "APPROVED" ? (
                        <button
                          className="docs-icon-btn"
                          title={doc.status === "ARCHIVED" ? "Restore / approve" : "Approve"}
                          onClick={() => handleApprove(doc.id)}
                          disabled={approveLoading}
                        >
                          {approveLoading ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                        </button>
                      ) : null}

                      {isAdmin && doc.status !== "ARCHIVED" ? (
                        <button
                          className="docs-icon-btn danger"
                          title="Archive"
                          onClick={() => handleArchive(doc.id)}
                          disabled={archiveLoading}
                        >
                          {archiveLoading ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <Archive size={14} />
                          )}
                        </button>
                      ) : null}

                      {isAdmin ? (
                        <button
                          className="docs-icon-btn danger"
                          title="Delete"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="docs-pagination">
              <span className="pagination-info">
                Page {page} of {totalPages} ({totalResults} results)
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
