import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  FileStack,
  Loader2,
  PencilLine,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  deleteCompany,
  fetchMyCompany,
  type Company,
  updateCompany,
} from "../../api/companyApi";

export default function CompanyPage() {
  const { user, logout } = useAuth();
  const role = (user?.role || "user").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCompany() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchMyCompany();
      const data = response.data || null;
      setCompany(data);
      setName(data?.name || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompany();
  }, []);

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || !name.trim()) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateCompany({ name: name.trim() });
      setNotice("Company updated.");
      await loadCompany();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      "Delete this company permanently? Related tenant data will be affected and this cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await deleteCompany(true);
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="company-loading">
        <Loader2 size={28} className="spin" />
        <p>Loading company...</p>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="doc-detail-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="company-page">
      <div className="company-header">
        <div>
          <h1>Company</h1>
          <p>
            Review the tenant profile, associated users, and unit structure for the
            current workspace.
          </p>
        </div>
        <span className="topbar-company">
          <Building2 size={14} />
          {`Company #${company?.id || user?.company_id || "-"}`}
        </span>
      </div>

      {error ? <div className="docs-error">{error}</div> : null}
      {notice ? <div className="form-success">{notice}</div> : null}

      <div className="company-metrics">
        <div className="dash-metric-card">
          <div className="metric-icon">
            <Building2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{company?.name || "-"}</span>
            <span className="metric-label">Company Name</span>
          </div>
        </div>
        <div className="dash-metric-card units">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{company?.users.length || 0}</span>
            <span className="metric-label">Users</span>
          </div>
        </div>
        <div className="dash-metric-card approved">
          <div className="metric-icon">
            <FileStack size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{company?.units.length || 0}</span>
            <span className="metric-label">Units</span>
          </div>
        </div>
      </div>

      <div className="company-grid">
        <section className="company-panel">
          <div className="doc-panel-heading">
            <PencilLine size={18} />
            <h2>Profile</h2>
          </div>

          {isAdmin ? (
            <form className="units-form" onSubmit={handleRename}>
              <label>
                <span>Company name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <button className="doc-detail-btn primary" type="submit" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                Save changes
              </button>
            </form>
          ) : (
            <div className="doc-edit-readonly">
              <p>Only admin users can update company settings.</p>
              <div className="doc-readonly-fields">
                <div>
                  <span>Company name</span>
                  <strong>{company?.name || "-"}</strong>
                </div>
                <div>
                  <span>Your role</span>
                  <strong>{role}</strong>
                </div>
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="company-danger-zone">
              <div className="doc-panel-heading">
                <ShieldCheck size={18} />
                <h2>Danger Zone</h2>
              </div>
              <p>
                Deleting the company will affect the tenant workspace and related
                records. Use this only when you intend to remove the company.
              </p>
              <button
                className="doc-detail-btn danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                Delete company
              </button>
            </div>
          ) : null}
        </section>

        <section className="company-panel">
          <div className="units-panel-head compact">
            <h2>Company Users</h2>
            <span>{company?.users.length || 0}</span>
          </div>

          {company?.users.length ? (
            <div className="company-list">
              {company.users.map((member) => (
                <div key={member.id} className="company-list-row">
                  <div>
                    <strong>{member.email}</strong>
                    <span>{member.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="units-empty compact">
              <Users size={24} />
              <p>No users found for this company.</p>
            </div>
          )}
        </section>

        <section className="company-panel">
          <div className="units-panel-head compact">
            <h2>Company Units</h2>
            <span>{company?.units.length || 0}</span>
          </div>

          {company?.units.length ? (
            <div className="company-list">
              {company.units.map((unit) => (
                <div key={unit.id} className="company-list-row">
                  <div>
                    <strong>{unit.name}</strong>
                    <span>{unit.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="units-empty compact">
              <FileStack size={24} />
              <p>No units found for this company.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
