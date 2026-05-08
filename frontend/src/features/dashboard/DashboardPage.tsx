import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FileCheck2,
  Archive,
  FilePenLine,
  Layers,
  Building2,
  Plus,
  Upload,
  ClipboardList,
  Clock,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchDocuments, type Document } from "../../api/documentApi";
import { fetchUnits, type Unit } from "../../api/unitApi";
import { fetchMyCompany, type Company } from "../../api/companyApi";
import { fetchAuditLogs, type AuditLog } from "../../api/auditApi";

type DashboardData = {
  company: Company | null;
  documents: Document[];
  totalDocs: number;
  units: Unit[];
  audits: AuditLog[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, unitsRes, companyRes, auditsRes] = await Promise.allSettled([
          fetchDocuments({ page: 1, limit: 100 }),
          fetchUnits(),
          fetchMyCompany(),
          fetchAuditLogs({ page: 1, limit: 5 }),
        ]);

        const documents =
          docsRes.status === "fulfilled" ? docsRes.value.data?.data || [] : [];
        const totalDocs =
          docsRes.status === "fulfilled" ? docsRes.value.data?.["total results"] || 0 : 0;
        const units =
          unitsRes.status === "fulfilled" ? unitsRes.value.data || [] : [];
        const company =
          companyRes.status === "fulfilled" ? companyRes.value.data || null : null;
        const audits =
          auditsRes.status === "fulfilled" ? auditsRes.value.data || [] : [];

        setData({ company, documents, totalDocs, units, audits });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 size={28} className="spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <p>{error}</p>
      </div>
    );
  }

  const docs = data?.documents || [];
  const draftCount = docs.filter((d) => d.status === "DRAFT").length;
  const approvedCount = docs.filter((d) => d.status === "APPROVED").length;
  const archivedCount = docs.filter((d) => d.status === "ARCHIVED").length;
  const activeUnits = (data?.units || []).filter((u) => !u.is_archived).length;

  return (
    <div className="dashboard">
      {/* Welcome section */}
      <div className="dash-welcome">
        <div>
          <h1>Welcome back, {user?.email?.split("@")[0] || "User"}</h1>
          <p>
            {data?.company
              ? `${data.company.name} — Company #${user?.company_id}`
              : `Company #${user?.company_id}`}
          </p>
        </div>
        <div className="dash-welcome-actions">
          <Link to="/app/documents" className="dash-action-btn primary">
            <Plus size={16} />
            New Document
          </Link>
          <Link to="/app/units" className="dash-action-btn secondary">
            <Plus size={16} />
            New Unit
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="dash-metrics">
        <div className="dash-metric-card">
          <div className="metric-icon">
            <FileText size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{data?.totalDocs ?? 0}</span>
            <span className="metric-label">Total Documents</span>
          </div>
        </div>

        <div className="dash-metric-card draft">
          <div className="metric-icon">
            <FilePenLine size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{draftCount}</span>
            <span className="metric-label">Draft</span>
          </div>
        </div>

        <div className="dash-metric-card approved">
          <div className="metric-icon">
            <FileCheck2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{approvedCount}</span>
            <span className="metric-label">Approved</span>
          </div>
        </div>

        <div className="dash-metric-card archived">
          <div className="metric-icon">
            <Archive size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{archivedCount}</span>
            <span className="metric-label">Archived</span>
          </div>
        </div>

        <div className="dash-metric-card units">
          <div className="metric-icon">
            <Layers size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{activeUnits}</span>
            <span className="metric-label">Active Units</span>
          </div>
        </div>
      </div>

      {/* Quick actions + Recent activity grid */}
      <div className="dash-grid">
        {/* Quick Actions */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <Activity size={18} />
            <h2>Quick Actions</h2>
          </div>
          <div className="dash-quick-grid">
            <Link to="/app/documents" className="quick-card">
              <FileText size={20} />
              <span>Manage Documents</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/app/units" className="quick-card">
              <Layers size={20} />
              <span>Manage Units</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/app/company" className="quick-card">
              <Building2 size={20} />
              <span>Company Settings</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/app/audits" className="quick-card">
              <ClipboardList size={20} />
              <span>View Audit Logs</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Recent Audits */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <Clock size={18} />
            <h2>Recent Activity</h2>
          </div>
          {data?.audits && data.audits.length > 0 ? (
            <div className="dash-audits">
              {data.audits.map((audit) => (
                <div key={audit.id} className="audit-row">
                  <div className="audit-action">{audit.action}</div>
                  <div className="audit-meta">
                    <span>{audit.entity_id?.slice(0, 8)}...</span>
                    <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">
              <ClipboardList size={32} />
              <p>No recent activity</p>
            </div>
          )}
        </section>
      </div>

      {/* Documents overview table */}
      <section className="dash-panel">
        <div className="dash-panel-header">
          <FileText size={18} />
          <h2>Recent Documents</h2>
          <Link to="/app/documents" className="dash-link">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {docs.length > 0 ? (
          <div className="dash-docs-table">
            <div className="dash-docs-head">
              <span>Title</span>
              <span>Type</span>
              <span>Status</span>
              <span>Updated</span>
            </div>
            {docs.slice(0, 5).map((doc) => (
              <Link
                to={`/app/documents/${doc.id}`}
                key={doc.id}
                className="dash-docs-row"
              >
                <span className="doc-title">{doc.title}</span>
                <span className="doc-type">{doc.type}</span>
                <span className={`status ${doc.status.toLowerCase()}`}>
                  {doc.status}
                </span>
                <span className="doc-date">
                  {new Date(doc.updated_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dash-empty">
            <Upload size={32} />
            <p>No documents yet. Create your first document to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}
