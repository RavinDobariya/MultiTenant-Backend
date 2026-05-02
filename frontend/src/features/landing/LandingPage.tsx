import {
  ArrowRight,
  Building2,
  Clock3,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  FolderKanban,
  LockKeyhole,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Building2,
    title: "Tenant-aware structure",
    text: "Companies, units, users, and documents stay organized inside their own workspace.",
  },
  {
    icon: FileCheck2,
    title: "Document workflows",
    text: "Create drafts, upload files, approve records, archive old documents, and keep work traceable.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    text: "Admins, editors, and users see the right actions based on backend permissions.",
  },
];

const workflow = ["Create units", "Upload documents", "Approve or archive", "Review audit logs"];

const capabilities = [
  "Tenant separation for company workspaces",
  "Document lifecycle from draft to archive",
  "Approval controls for administrators",
  "Upload-ready file management",
  "Audit history for accountable operations",
  "Search, filters, sorting, and pagination",
];

const roles = [
  {
    name: "Admin",
    text: "Owns approvals, archives, company settings, audit visibility, and final delete decisions.",
  },
  {
    name: "Editor",
    text: "Creates units, prepares document records, uploads files, and keeps metadata clean.",
  },
  {
    name: "User",
    text: "Finds approved documents quickly without seeing controls that do not belong to their role.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <FileText size={19} strokeWidth={2.4} />
          </span>
          <span>DocuTenant</span>
        </Link>

        <nav className="header-nav" aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <a href="#roles">Roles</a>
          <Link to="/login">Login</Link>
        </nav>

        <Link to="/signup" className="header-action">
          Get started
        </Link>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <LockKeyhole size={15} />
            Enterprise-ready tenant isolation
          </div>

          <h1>Govern documents across tenants, units, roles, and audits.</h1>

          <p className="hero-copy">
            DocuTenant turns your FastAPI backend into a polished operating
            console for policy control, file uploads, approvals, archives, and
            traceable audit activity.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="primary-button">
              Open dashboard
              <ArrowRight size={18} />
            </Link>
            <Link to="/signup" className="secondary-button">
              Create account
            </Link>
          </div>

          <div className="hero-proof" aria-label="Project capabilities">
            <span>
              <CheckCircle2 size={17} />
              JWT sessions
            </span>
            <span>
              <CheckCircle2 size={17} />
              Cloud uploads
            </span>
            <span>
              <CheckCircle2 size={17} />
              Audit trail
            </span>
          </div>

          <div className="hero-stats" aria-label="Document management statistics">
            <div>
              <strong>3</strong>
              <span>role levels</span>
            </div>
            <div>
              <strong>10MB</strong>
              <span>file limit</span>
            </div>
            <div>
              <strong>100</strong>
              <span>rows per page</span>
            </div>
          </div>
        </div>

        <div className="product-preview" aria-label="Document management dashboard preview">
          <div className="preview-window">
            <div className="scan-line" />
            <div className="preview-topbar">
              <div>
                <p>Tenant workspace</p>
                <strong>Acme Compliance Hub</strong>
              </div>
              <span>ADMIN ACTIVE</span>
            </div>

            <div className="preview-grid">
              <aside className="preview-sidebar">
                <div className="preview-nav active">Documents</div>
                <div className="preview-nav">Units</div>
                <div className="preview-nav">Company</div>
                <div className="preview-nav">Audits</div>
              </aside>

              <section className="preview-main">
                <div className="preview-toolbar">
                  <div className="preview-search">
                    <Search size={15} />
                    <span>Search policy, report, manual...</span>
                  </div>
                  <button type="button">
                    <UploadCloud size={15} />
                    Upload
                  </button>
                </div>

                <div className="metric-row">
                  <div className="metric-card">
                    <span>Total docs</span>
                    <strong>128</strong>
                  </div>
                  <div className="metric-card approved">
                    <span>Approved</span>
                    <strong>94</strong>
                  </div>
                  <div className="metric-card draft">
                    <span>Draft</span>
                    <strong>21</strong>
                  </div>
                </div>

                <div className="document-table">
                  <div className="table-head">
                    <span>Document</span>
                    <span>Type</span>
                    <span>Status</span>
                  </div>
                  <div className="table-row">
                    <span>Leave Policy</span>
                    <span>POLICY</span>
                    <em className="status approved">APPROVED</em>
                  </div>
                  <div className="table-row">
                    <span>Finance Manual</span>
                    <span>MANUAL</span>
                    <em className="status draft">DRAFT</em>
                  </div>
                  <div className="table-row">
                    <span>Q1 Audit Report</span>
                    <span>REPORT</span>
                    <em className="status archived">ARCHIVED</em>
                  </div>
                  <div className="table-row">
                    <span>Security Checklist</span>
                    <span>POLICY</span>
                    <em className="status approved">APPROVED</em>
                  </div>
                </div>

                <div className="activity-strip">
                  <Clock3 size={16} />
                  <span>DOCUMENT_UPLOADED by admin@gmail.com · 2 minutes ago</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <p className="eyebrow">Built from your backend</p>
          <h2>Everything maps to real API features.</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">
                  <Icon size={22} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="story-section" id="platform">
        <div className="story-copy">
          <p className="eyebrow">Why this exists</p>
          <h2>Documents become risky when teams manage them without structure.</h2>
          <p>
            In most organizations, policies and reports move through email,
            local folders, and unclear approval chains. DocuTenant presents a
            cleaner model: every record belongs to a tenant, every document
            belongs to a unit, and every important action can be reviewed later.
          </p>
        </div>

        <div className="capability-panel">
          <div className="capability-header">
            <Sparkles size={20} />
            <span>Product capabilities</span>
          </div>
          <div className="capability-list">
            {capabilities.map((item) => (
              <div className="capability-item" key={item}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="architecture-section">
        <div className="architecture-card">
          <div className="architecture-icon">
            <Network size={24} />
          </div>
          <h3>Multi-tenant by design</h3>
          <p>
            Company, unit, user, and document relationships are treated as the
            core model, so the interface can guide users through the same mental
            structure as the backend.
          </p>
        </div>

        <div className="architecture-card featured">
          <div className="architecture-icon">
            <Database size={24} />
          </div>
          <h3>Operational data, not static pages</h3>
          <p>
            The frontend is planned around live API workflows: auth sessions,
            paginated documents, filtered audit logs, uploads, role checks, and
            confirmation flows.
          </p>
        </div>

        <div className="architecture-card">
          <div className="architecture-icon">
            <Users size={24} />
          </div>
          <h3>Built for review and presentation</h3>
          <p>
            Clear dashboards, professional dark UI, lifecycle labels, and audit
            history make the project easier to explain and more impressive in a
            college evaluation.
          </p>
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-card">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>From company structure to audit-ready records.</h2>
          </div>

          <div className="workflow-steps">
            {workflow.map((step, index) => (
              <div className="workflow-step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <div className="workflow-note">
            <FolderKanban size={20} />
            <p>
              The next frontend slices will connect this flow to login, the
              dashboard, document tables, upload actions, and audit screens.
            </p>
          </div>
        </div>
      </section>

      <section className="roles-section" id="roles">
        <div className="section-heading roles-heading">
          <div>
            <p className="eyebrow">Role command center</p>
            <h2>Different users, different decisions, one consistent system.</h2>
          </div>
        </div>

        <div className="role-grid">
          {roles.map((role) => (
            <article className="role-card" key={role.name}>
              <span>{role.name}</span>
              <p>{role.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-panel">
          <div>
            <p className="eyebrow">Next step</p>
            <h2>Move from landing page to authenticated workspace.</h2>
            <p>
              The next implementation slice will add a polished login flow,
              token handling, and protected routes for the real dashboard.
            </p>
          </div>
          <Link to="/login" className="primary-button">
            Continue to login
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <FileText size={19} strokeWidth={2.4} />
          </span>
          <span>DocuTenant</span>
        </Link>
        <p>Multi-tenant document management system for company, unit, document, and audit workflows.</p>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </main>
  );
}
