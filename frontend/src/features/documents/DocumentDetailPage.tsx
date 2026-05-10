import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  PencilLine,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  approveDocument,
  archiveDocument,
  downloadDocumentFile,
  fetchDocumentById,
  type Document,
  updateDocumentMetadata,
} from "../../api/documentApi";
import { fetchUnits, type Unit } from "../../api/unitApi";

const TYPE_OPTIONS = ["POLICY", "MANUAL", "REPORT"] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = (user?.role || "user").toUpperCase();
  const [document, setDocument] = useState<Document | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "archive" | "download" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Document["type"]>("POLICY");

  const canEditDraft = (role === "ADMIN" || role === "EDITOR") && document?.status === "DRAFT";
  const canApprove = role === "ADMIN" && !!document && document.status !== "APPROVED";
  const canArchive = role === "ADMIN" && !!document && document.status !== "ARCHIVED";

  async function loadDocument() {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const [docRes, unitsRes] = await Promise.all([
        fetchDocumentById(id),
        fetchUnits().catch(() => null),
      ]);

      const doc = docRes.data || null;
      setDocument(doc);
      setTitle(doc?.title || "");
      setDescription(doc?.description || "");
      setType(doc?.type || "POLICY");

      if (unitsRes?.data) {
        setUnits(unitsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocument();
  }, [id]);

  const unit = useMemo(
    () => units.find((entry) => entry.id === document?.unit_id),
    [units, document?.unit_id]
  );

  async function handleMetadataSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !document) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateDocumentMetadata(id, {
        title: title.trim(),
        description: description.trim(),
        type,
      });
      setNotice("Document metadata updated.");
      await loadDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!id) return;
    setActionLoading("approve");
    setError("");
    setNotice("");

    try {
      await approveDocument(id);
      setNotice("Document moved to approved state.");
      await loadDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive() {
    if (!id) return;
    setActionLoading("archive");
    setError("");
    setNotice("");

    try {
      await archiveDocument(id);
      setNotice("Document archived.");
      await loadDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive document");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownload() {
    if (!id) return;
    setActionLoading("download");
    setError("");

    try {
      const blob = await downloadDocumentFile(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download file");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="doc-detail-loading">
        <Loader2 size={28} className="spin" />
        <p>Loading document...</p>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="doc-detail-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="doc-detail-error">
        <p>Document not found.</p>
      </div>
    );
  }

  return (
    <div className="doc-detail-page">
      <div className="doc-detail-header">
        <div>
          <Link to="/app/documents" className="doc-detail-back">
            <ArrowLeft size={15} />
            Back to documents
          </Link>
          <h1>{document.title}</h1>
          <p>
            {unit?.name || `Unit ${document.unit_id.slice(0, 8)}`} · Document ID{" "}
            {document.id.slice(0, 8)}
          </p>
        </div>

        <div className="doc-detail-actions">
          {document.file_url ? (
            <>
              <a
                className="doc-detail-btn secondary"
                href={document.file_url}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={16} />
                View file
              </a>
              <button
                className="doc-detail-btn secondary"
                onClick={handleDownload}
                disabled={actionLoading === "download"}
              >
                {actionLoading === "download" ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Download size={16} />
                )}
                Download
              </button>
            </>
          ) : null}

          {canApprove ? (
            <button
              className="doc-detail-btn primary"
              onClick={handleApprove}
              disabled={actionLoading === "approve"}
            >
              {actionLoading === "approve" ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {document.status === "ARCHIVED" ? "Restore" : "Approve"}
            </button>
          ) : null}

          {canArchive ? (
            <button
              className="doc-detail-btn danger"
              onClick={handleArchive}
              disabled={actionLoading === "archive"}
            >
              {actionLoading === "archive" ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Archive size={16} />
              )}
              Archive
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="docs-error">{error}</div> : null}
      {notice ? <div className="form-success">{notice}</div> : null}

      <div className="doc-detail-grid">
        <section className="doc-detail-panel doc-overview-panel">
          <div className="doc-panel-heading">
            <FileText size={18} />
            <h2>Overview</h2>
          </div>

          <div className="doc-overview-stats">
            <div className="doc-stat-card">
              <span>Status</span>
              <strong className={`status ${document.status.toLowerCase()}`}>
                {document.status}
              </strong>
            </div>
            <div className="doc-stat-card">
              <span>Type</span>
              <strong>{document.type}</strong>
            </div>
            <div className="doc-stat-card">
              <span>File</span>
              <strong>{document.file_url ? "Attached" : "Missing"}</strong>
            </div>
          </div>

          <div className="doc-meta-list">
            <div className="doc-meta-row">
              <span>
                <Building2 size={15} />
                Unit
              </span>
              <strong>{unit?.name || document.unit_id}</strong>
            </div>
            <div className="doc-meta-row">
              <span>
                <CalendarDays size={15} />
                Created
              </span>
              <strong>{formatDate(document.created_at)}</strong>
            </div>
            <div className="doc-meta-row">
              <span>
                <CalendarDays size={15} />
                Updated
              </span>
              <strong>{formatDate(document.updated_at)}</strong>
            </div>
            <div className="doc-meta-row">
              <span>
                <ShieldCheck size={15} />
                Approved by
              </span>
              <strong>{document.approved_by || "-"}</strong>
            </div>
          </div>

          <div className="doc-description-block">
            <h3>Description</h3>
            <p>{document.description || "No description provided for this document."}</p>
          </div>
        </section>

        <section className="doc-detail-panel">
          <div className="doc-panel-heading">
            <PencilLine size={18} />
            <h2>Metadata</h2>
          </div>

          {canEditDraft ? (
            <form className="doc-edit-form" onSubmit={handleMetadataSave}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Type</span>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as Document["type"])}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                />
              </label>

              <button className="doc-detail-btn primary" type="submit" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                Save metadata
              </button>
            </form>
          ) : (
            <div className="doc-edit-readonly">
              <p>
                Metadata editing is only available for draft documents and only to
                admin or editor roles.
              </p>
              <div className="doc-readonly-fields">
                <div>
                  <span>Title</span>
                  <strong>{document.title}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{document.type}</strong>
                </div>
                <div>
                  <span>Description</span>
                  <strong>{document.description || "-"}</strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
