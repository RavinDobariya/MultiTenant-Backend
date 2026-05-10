import { useState } from "react";
import {
  Building2,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { deleteMyAccount } from "../../api/authApi";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";

function roleBadgeClass(role: string) {
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === "ADMIN") return "role-badge admin";
  if (normalizedRole === "EDITOR") return "role-badge editor";
  return "role-badge user";
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const { pushToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    const confirmed = await confirm({
      title: "Delete account",
      description: "Delete your account? This will mark your user record as deleted and end your session.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteMyAccount(true);
      pushToast({ message: "Account deleted.", tone: "success" });
      await logout();
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to delete account",
        tone: "error",
      });
      setDeleting(false);
    }
  }

  return (
    <div className="account-page">
      <div className="account-header">
        <div>
          <h1>Account</h1>
          <p>Review your current access profile and session controls.</p>
        </div>
      </div>
      <div className="account-grid">
        <section className="company-panel">
          <div className="doc-panel-heading">
            <UserCircle size={18} />
            <h2>Profile</h2>
          </div>

          <div className="account-info-list">
            <div className="doc-meta-row">
              <span>
                <Mail size={15} />
                Email
              </span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div className="doc-meta-row">
              <span>
                <ShieldCheck size={15} />
                Role
              </span>
              <strong>
                <span className={roleBadgeClass(user?.role || "user")}>
                  {user?.role?.toUpperCase() || "USER"}
                </span>
              </strong>
            </div>

            <div className="doc-meta-row">
              <span>
                <Building2 size={15} />
                Company ID
              </span>
              <strong>{user?.company_id || "-"}</strong>
            </div>

            <div className="doc-meta-row">
              <span>
                <UserCircle size={15} />
                User ID
              </span>
              <strong>{user?.user_id || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="company-panel">
          <div className="doc-panel-heading">
            <LogOut size={18} />
            <h2>Session</h2>
          </div>

          <p className="account-copy">
            End the current session on this device or remove your account from the
            active tenant workspace.
          </p>

          <div className="account-actions">
            <button className="doc-detail-btn secondary" onClick={logout}>
              <LogOut size={16} />
              Logout
            </button>

            <button
              className="doc-detail-btn danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              Delete account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
