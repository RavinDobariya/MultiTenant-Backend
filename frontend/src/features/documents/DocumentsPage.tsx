import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  FilePlus2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchDocuments,
  type Document,
} from "../../api/documentApi";
import { fetchUnits, type Unit } from "../../api/unitApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["", "DRAFT", "APPROVED", "ARCHIVED"];
const TYPE_OPTIONS = ["", "POLICY", "MANUAL", "REPORT"];
const SORT_OPTIONS = [
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "type", label: "Type" },
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const role = (user?.role || "user").toUpperCase();

  // Data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Load units for filter dropdown
  useEffect(() => {
    fetchUnits()
      .then((res) => {
        if (res.data) setUnits(res.data);
      })
      .catch(() => {});
  }, []);

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

  const hasActiveFilters = statusFilter || typeFilter || unitFilter || showArchived;

  return (
    <div className="docs-page">
      {/* Header */}
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
          {(role === "ADMIN" || role === "EDITOR") && (
            <Link to="/app/documents" className="docs-create-btn" onClick={(e) => e.preventDefault()}>
              <FilePlus2 size={16} />
              New Document
            </Link>
          )}
        </div>
      </div>

      {/* Filters bar */}
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
                  <option key={s} value={s}>{s}</option>
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
                  <option key={t} value={t}>{t}</option>
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

      {/* Error */}
      {error && <div className="docs-error">{error}</div>}

      {/* Table */}
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
              {/* Header */}
              <div className="docs-table-head">
                <button
                  className="docs-th sortable"
                  onClick={() => toggleSort("title")}
                >
                  Title
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "title" ? "sort-active" : ""}
                  />
                </button>
                <button
                  className="docs-th sortable"
                  onClick={() => toggleSort("type")}
                >
                  Type
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "type" ? "sort-active" : ""}
                  />
                </button>
                <button
                  className="docs-th sortable"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "status" ? "sort-active" : ""}
                  />
                </button>
                <span className="docs-th">Unit</span>
                <button
                  className="docs-th sortable"
                  onClick={() => toggleSort("created_at")}
                >
                  Created
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "created_at" ? "sort-active" : ""}
                  />
                </button>
                <button
                  className="docs-th sortable"
                  onClick={() => toggleSort("updated_at")}
                >
                  Updated
                  <ArrowUpDown
                    size={13}
                    className={sortBy === "updated_at" ? "sort-active" : ""}
                  />
                </button>
              </div>

              {/* Rows */}
              {documents.map((doc) => {
                const unit = units.find((u) => u.id === doc.unit_id);
                return (
                  <Link
                    to={`/app/documents/${doc.id}`}
                    key={doc.id}
                    className="docs-table-row"
                  >
                    <span className="doc-cell-title">
                      {doc.file_url && <FileText size={14} className="doc-file-icon" />}
                      {doc.title}
                    </span>
                    <span className="doc-cell-type">{doc.type}</span>
                    <span>
                      <span className={`status ${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </span>
                    <span className="doc-cell-unit">
                      {unit?.name || doc.unit_id.slice(0, 8)}
                    </span>
                    <span className="doc-cell-date">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span className="doc-cell-date">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
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
