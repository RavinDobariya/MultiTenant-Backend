import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Building2,
  FileStack,
  Loader2,
  PencilLine,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  UserPlus2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SplitPanelSkeleton } from "../../components/ui/Skeletons";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import {
  approveJoinRequest,
  deleteCompany,
  fetchMyCompany,
  fetchJoinRequests,
  type JoinRequest,
  rejectJoinRequest,
  type Company,
  updateCompany,
} from "../../api/companyApi";

export default function CompanyPage() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const { pushToast } = useToast();
  const role = (user?.role || "user").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState("");
  const [error, setError] = useState("");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [reviewRoles, setReviewRoles] = useState<Record<string, "admin" | "editor" | "user">>(
    {}
  );

  async function loadCompany() {
    setLoading(true);
    setError("");

    try {
      const [companyResponse, joinRequestResponse] = await Promise.all([
        fetchMyCompany(),
        isAdmin ? fetchJoinRequests() : Promise.resolve({ data: [] as JoinRequest[] }),
      ]);
      const data = companyResponse.data || null;
      setCompany(data);
      setName(data?.name || "");
      const requests = joinRequestResponse.data || [];
      setJoinRequests(requests);
      setReviewRoles(
        requests.reduce<Record<string, "admin" | "editor" | "user">>((acc, request) => {
          acc[request.id] = request.requested_role;
          return acc;
        }, {})
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load company";
      setError(message);
      pushToast({ message, tone: "error" });
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

    try {
      await updateCompany({ name: name.trim() });
      pushToast({ message: "Company updated.", tone: "success" });
      await loadCompany();
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to update company",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin) return;

    const confirmed = await confirm({
      title: "Delete company",
      description:
        "Delete this company permanently? Related tenant data will be affected and this cannot be undone.",
      confirmLabel: "Delete company",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteCompany(true);
      pushToast({ message: "Company deleted.", tone: "success" });
      await logout();
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to delete company",
        tone: "error",
      });
      setDeleting(false);
    }
  }

  async function handleApprove(requestId: string) {
    setProcessingRequestId(requestId);

    try {
      await approveJoinRequest(requestId, reviewRoles[requestId]);
      pushToast({ message: "Join request approved.", tone: "success" });
      await loadCompany();
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to approve join request",
        tone: "error",
      });
    } finally {
      setProcessingRequestId("");
    }
  }

  async function handleReject(requestId: string) {
    setProcessingRequestId(requestId);

    try {
      await rejectJoinRequest(requestId);
      pushToast({ message: "Join request rejected.", tone: "success" });
      await loadCompany();
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to reject join request",
        tone: "error",
      });
    } finally {
      setProcessingRequestId("");
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  if (loading) {
    return <SplitPanelSkeleton />;
  }

  if (error && !company) {
    return (
      <div className="page-state-panel">
        <p>{error}</p>
        <button className="pagination-btn" onClick={() => void loadCompany()}>
          Retry
        </button>
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

      {error && company ? (
        <div className="page-inline-feedback">
          <span>{error}</span>
          <button className="pagination-btn" onClick={() => void loadCompany()}>
            Retry
          </button>
        </div>
      ) : null}

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
            <h2>Join Requests</h2>
            <span>{joinRequests.length}</span>
          </div>

          {isAdmin ? (
            joinRequests.length ? (
              <div className="company-list">
                {joinRequests.map((request) => {
                  const isPending = request.status === "PENDING";
                  const isProcessing = processingRequestId === request.id;

                  return (
                    <div key={request.id} className="company-list-row company-request-row">
                      <div className="company-request-main">
                        <strong>{request.email}</strong>
                        <span>{`Requested ${request.requested_role.toUpperCase()} on ${formatDate(
                          request.created_at
                        )}`}</span>
                        {request.reviewed_at ? (
                          <span>
                            {`Reviewed ${formatDate(request.reviewed_at)}${
                              request.reviewed_by_email
                                ? ` by ${request.reviewed_by_email}`
                                : ""
                            }`}
                          </span>
                        ) : null}
                        {request.rejection_reason ? (
                          <span>{request.rejection_reason}</span>
                        ) : null}
                      </div>

                      <div className="company-request-actions">
                        <span className={`company-status-pill ${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>

                        {isPending ? (
                          <>
                            <select
                              value={reviewRoles[request.id] || request.requested_role}
                              onChange={(event) =>
                                setReviewRoles((current) => ({
                                  ...current,
                                  [request.id]: event.target.value as "admin" | "editor" | "user",
                                }))
                              }
                            >
                              <option value="user">User</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              className="doc-detail-btn primary"
                              onClick={() => handleApprove(request.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 size={16} className="spin" />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                              Approve
                            </button>
                            <button
                              className="doc-detail-btn danger"
                              onClick={() => handleReject(request.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 size={16} className="spin" />
                              ) : (
                                <XCircle size={16} />
                              )}
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="company-request-note">
                            {request.status === "APPROVED"
                              ? "Account created"
                              : "Request closed"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="units-empty compact">
                <UserPlus2 size={24} />
                <p>No join requests for this company.</p>
              </div>
            )
          ) : (
            <div className="units-empty compact">
              <ShieldCheck size={24} />
              <p>Only company admins can review join requests.</p>
            </div>
          )}
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
