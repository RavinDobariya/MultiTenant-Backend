import { useEffect, useState } from "react";
import {
  ClipboardList,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAdminAuditLogs,
  fetchMyAuditLogs,
  type AuditLog,
} from "../../api/auditApi";
import { TableSkeleton } from "../../components/ui/Skeletons";
import { useToast } from "../../context/ToastContext";

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const role = (user?.role || "user").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");

  useEffect(() => {
    async function loadAudits() {
      setLoading(true);
      setError("");

      try {
        if (isAdmin) {
          const response = await fetchAdminAuditLogs({
            page,
            limit: PAGE_SIZE,
            ...(actionFilter ? { action: actionFilter.trim() } : {}),
            ...(userIdFilter ? { user_id: userIdFilter.trim() } : {}),
            ...(entityIdFilter ? { entity_id: entityIdFilter.trim() } : {}),
          });

          const rows = response.data || [];
          setAudits(rows);
          setHasMore(rows.length === PAGE_SIZE);
        } else {
          const response = await fetchMyAuditLogs();
          const rows = response.data || [];
          setAudits(rows);
          setHasMore(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load audit logs";
        setError(message);
        pushToast({ message, tone: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadAudits();
  }, [isAdmin, page, actionFilter, userIdFilter, entityIdFilter, reloadToken, pushToast]);

  function resetFilters() {
    setPage(1);
    setActionFilter("");
    setUserIdFilter("");
    setEntityIdFilter("");
  }

  return (
    <div className="audits-page">
      <div className="audits-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            {isAdmin
              ? "Review tenant activity across actions, users, and entities."
              : "Review your recent document, unit, and company activity."}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <section className="audits-filters">
          <div className="audits-filter-head">
            <Filter size={16} />
            <span>Filters</span>
          </div>

          <div className="audits-filter-grid">
            <label>
              <span>Action</span>
              <input
                type="text"
                value={actionFilter}
                onChange={(event) => {
                  setActionFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="DOCUMENT_UPDATED"
              />
            </label>

            <label>
              <span>User ID</span>
              <input
                type="text"
                value={userIdFilter}
                onChange={(event) => {
                  setUserIdFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="User UUID"
              />
            </label>

            <label>
              <span>Entity ID</span>
              <input
                type="text"
                value={entityIdFilter}
                onChange={(event) => {
                  setEntityIdFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="Document or unit ID"
              />
            </label>
          </div>

          {(actionFilter || userIdFilter || entityIdFilter) && (
            <button className="docs-filter-clear" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </section>
      ) : null}

      {error && audits.length > 0 ? (
        <div className="page-inline-feedback">
          <span>{error}</span>
          <button className="pagination-btn" onClick={() => setReloadToken((current) => current + 1)}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="audits-panel">
        <div className="units-panel-head compact">
          <h2>{isAdmin ? "Activity Stream" : "Your Activity"}</h2>
          <span>{loading ? "Loading" : `${audits.length} rows`}</span>
        </div>

        {!loading && error && audits.length === 0 ? (
          <div className="page-state-panel compact">
            <p>{error}</p>
            <button className="pagination-btn" onClick={() => setReloadToken((current) => current + 1)}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <TableSkeleton rows={7} />
        ) : audits.length === 0 ? (
          <div className="units-empty">
            <ClipboardList size={30} />
            <p>No audit logs found for the current view.</p>
          </div>
        ) : (
          <>
            <div className="audits-table">
              <div className="audits-table-head">
                <span>Action</span>
                {isAdmin ? <span>User</span> : null}
                <span>Entity</span>
                <span>Timestamp</span>
              </div>

              {audits.map((audit) => (
                <div key={audit.id} className="audits-table-row">
                  <span className="audit-action-pill">{audit.action}</span>
                  {isAdmin ? (
                    <span className="audit-cell-muted">{audit.user_id || "-"}</span>
                  ) : null}
                  <span className="audit-cell-muted">{audit.entity_id}</span>
                  <span className="audit-cell-muted">
                    {new Date(audit.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {isAdmin ? (
              <div className="docs-pagination">
                <span className="pagination-info">Page {page}</span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={!hasMore}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
