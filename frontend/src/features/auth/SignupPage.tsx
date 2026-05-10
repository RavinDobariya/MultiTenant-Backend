import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { signupCompany } from "../../api/authApi";
import {
  createJoinRequest,
  discoverCompanies,
  type DiscoveredCompany,
} from "../../api/companyApi";
import { useToast } from "../../context/ToastContext";

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
  const { pushToast } = useToast();
  const [mode, setMode] = useState<SignupMode>("create_company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyOptions, setCompanyOptions] = useState<DiscoveredCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<DiscoveredCompany | null>(null);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [role, setRole] = useState<"admin" | "editor" | "user">("user");
  const [createdCompanyId, setCreatedCompanyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === role),
    [role]
  );

  useEffect(() => {
    if (mode !== "join") return;

    const trimmedQuery = companySearch.trim();
    if (!trimmedQuery) {
      setCompanyOptions([]);
      setIsSearchingCompanies(false);
      return;
    }

    if (trimmedQuery.length < 3) {
      setCompanyOptions([]);
      setIsSearchingCompanies(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingCompanies(true);

      try {
        const response = await discoverCompanies(trimmedQuery);
        setCompanyOptions(response.data || []);
      } catch {
        setCompanyOptions([]);
      } finally {
        setIsSearchingCompanies(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [companySearch, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatedCompanyId("");

    const trimmedEmail = email.trim();
    const trimmedCompanyName = companyName.trim();

    if (password.length < 8 || password.length > 12) {
      pushToast({ message: "Password must be between 8 and 12 characters.", tone: "error" });
      return;
    }

    if (mode === "join" && !selectedCompany) {
      pushToast({ message: "Select a company before sending the join request.", tone: "error" });
      return;
    }

    if (mode === "create_company" && !trimmedCompanyName) {
      pushToast({ message: "Company name is required.", tone: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "join") {
        await createJoinRequest({
          email: trimmedEmail,
          password,
          requested_role: role,
          company_name: selectedCompany!.name,
        });
        pushToast({
          message: "Join request submitted. A company admin must approve it before you can log in.",
          tone: "success",
        });
      } else {
        const response = await signupCompany({
          company_name: trimmedCompanyName,
          email: trimmedEmail,
          password,
        });
        const createdId = response.data?.company_id || "";
        setCreatedCompanyId(createdId);
        pushToast({
          message: "Workspace created. You can now log in with the admin account.",
          tone: "success",
        });
        window.setTimeout(() => navigate("/login"), 1200);
      }
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Signup failed",
        tone: "error",
      });
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
            Create the first admin account for a new workspace, or search for an
            existing company and send a membership request for admin review.
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
                : "Search for the company, request a role, and wait for admin approval."}
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
                  <span>Company search</span>
                  <div className="search-input-wrap">
                    <Search size={16} />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={(event) => {
                        setCompanySearch(event.target.value);
                        setSelectedCompany(null);
                      }}
                      placeholder="Search by company name, minimum 3 letters"
                      autoComplete="off"
                      required
                    />
                  </div>

                  {companySearch.trim().length > 0 && companySearch.trim().length < 3 ? (
                    <div className="search-results-note">
                      Enter at least 3 letters to search.
                    </div>
                  ) : null}

                  {isSearchingCompanies ? (
                    <div className="search-results-note">Searching companies...</div>
                  ) : null}

                  {companyOptions.length ? (
                    <div className="company-search-results">
                      {companyOptions.map((company) => (
                        <button
                          key={company.name}
                          type="button"
                          className={`company-search-result ${
                            selectedCompany?.name === company.name ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedCompany(company);
                            setCompanySearch(company.name);
                          }}
                        >
                          <strong>{company.name}</strong>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>

                <label>
                  <span>Selected company</span>
                  <input
                    type="text"
                    value={selectedCompany?.name || ""}
                    readOnly
                    placeholder="Choose a company from search results"
                    autoComplete="off"
                  />
                </label>

                <p className="form-hint">
                  Submit the request to the target company. An admin must approve it before your account becomes active.
                </p>
              </>
            ) : (
              <p className="form-hint">
                This creates the workspace and the first admin account in one step.
              </p>
            )}

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
