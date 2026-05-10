import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { signup, signupCompany } from "../../api/authApi";

const ROLE_OPTIONS = [
  {
    value: "user" as const,
    label: "User",
    description: "Read-only access for company, unit, and document views.",
  },
  {
    value: "editor" as const,
    label: "Editor",
    description: "Create and update units and documents inside the tenant.",
  },
  {
    value: "admin" as const,
    label: "Admin",
    description: "Full company control, approvals, and audit access.",
  },
];

type SignupMode = "join" | "create_company";

export default function SignupPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SignupMode>("create_company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "user">("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCompanyId, setCreatedCompanyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === role),
    [role]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedCompanyId("");

    const trimmedEmail = email.trim();
    const trimmedCompanyId = companyId.trim();
    const trimmedCompanyName = companyName.trim();

    if (password.length < 8 || password.length > 12) {
      setError("Password must be between 8 and 12 characters.");
      return;
    }

    if (mode === "join" && !trimmedCompanyId) {
      setError("Company ID is required.");
      return;
    }

    if (mode === "create_company" && !trimmedCompanyName) {
      setError("Company name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "join") {
        await signup({
          email: trimmedEmail,
          password,
          role,
          company_id: trimmedCompanyId,
        });
        setSuccess("Account created. Redirecting to login...");
      } else {
        const response = await signupCompany({
          company_name: trimmedCompanyName,
          email: trimmedEmail,
          password,
        });
        const createdId = response.data?.company_id || "";
        setCreatedCompanyId(createdId);
        setSuccess("Workspace created. You can now log in with the admin account.");
      }

      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark">
            <FileText size={19} strokeWidth={2.4} />
          </span>
          <span>DocuTenant</span>
        </Link>

        <div className="auth-story">
          <p className="eyebrow">Company onboarding</p>
          <h1>Start a new workspace or join an existing tenant.</h1>
          <p>
            The deadlock is removed now. You can create the first company admin
            directly from this screen, or join an existing company when you already
            have its company ID.
          </p>
        </div>

        <div className="auth-signal-grid" aria-label="Signup requirements">
          <div>
            <Building2 size={20} />
            <span>Create or join company</span>
          </div>
          <div>
            <Users size={20} />
            <span>Role-based access</span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <span>Tenant-linked account</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="eyebrow">New account</p>
            <h2>Create your access profile</h2>
            <p>
              {mode === "create_company"
                ? "Create the company workspace and its first admin account."
                : "Join an existing company workspace with its company ID."}
            </p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Signup mode">
            <button
              type="button"
              className={`auth-mode-btn ${mode === "create_company" ? "active" : ""}`}
              onClick={() => setMode("create_company")}
            >
              Create workspace
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === "join" ? "active" : ""}`}
              onClick={() => setMode("join")}
            >
              Join existing
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === "create_company" ? (
              <label>
                <span>Company name</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Acme Compliance Hub"
                  autoComplete="organization"
                  required
                />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="member@company.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 to 12 characters"
                autoComplete="new-password"
                minLength={8}
                maxLength={12}
                required
              />
            </label>

            {mode === "join" ? (
              <>
                <label>
                  <span>Role</span>
                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as "admin" | "editor" | "user")
                    }
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="form-hint">{selectedRole?.description}</p>

                <label>
                  <span>Company ID</span>
                  <input
                    type="text"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                    placeholder="Paste the tenant company ID"
                    autoComplete="off"
                    required
                  />
                </label>

                <p className="form-hint">
                  Use this when an admin has already created the workspace and shared the company ID.
                </p>
              </>
            ) : (
              <p className="form-hint">
                This creates the workspace and the first admin account in one step.
              </p>
            )}

            {error ? <div className="form-error">{error}</div> : null}
            {success ? <div className="form-success">{success}</div> : null}
            {createdCompanyId ? (
              <div className="form-success">
                {`Created company ID: ${createdCompanyId}`}
              </div>
            ) : null}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {mode === "create_company" ? "Creating workspace" : "Creating account"}
                </>
              ) : (
                <>
                  {mode === "create_company" ? "Create workspace" : "Create account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-meta">
            <span>
              <CheckCircle2 size={16} />
              Backend validation currently allows passwords from 8 to 12 characters.
            </span>
            <Link to="/login">Already have an account?</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
