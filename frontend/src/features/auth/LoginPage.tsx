import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { login } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });

      if (!response.data) {
        throw new Error("Login response did not include tokens");
      }

      await authLogin(response.data);
      pushToast({ message: "Login successful.", tone: "success" });
      navigate("/app");
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Login failed",
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
          <p className="eyebrow">Secure access</p>
          <h1>Enter the document control workspace.</h1>
          <p>
            Sign in to manage tenant documents, unit-level records, approval
            decisions, upload activity, and audit history from one operational
            console.
          </p>
        </div>

        <div className="auth-signal-grid" aria-label="Security highlights">
          <div>
            <ShieldCheck size={20} />
            <span>Role-aware screens</span>
          </div>
          <div>
            <LockKeyhole size={20} />
            <span>Bearer token auth</span>
          </div>
          <div>
            <KeyRound size={20} />
            <span>Refresh sessions</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="eyebrow">Welcome back</p>
            <h2>Login to your account</h2>
            <p>Use your company credentials to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@gmail.com"
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
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Authenticating
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-meta">
            <span>
              <CheckCircle2 size={16} />
              Tokens are stored locally for this college project build.
            </span>
            <Link to="/signup">Need an account?</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
