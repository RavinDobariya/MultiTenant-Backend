import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Layers,
  ClipboardList,
  UserCircle,
  LogOut,
  Menu,
  FileStack,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/documents", icon: FileText, label: "Documents", end: false },
  { to: "/app/units", icon: Layers, label: "Units", end: false },
  { to: "/app/company", icon: Building2, label: "Company", end: false },
  { to: "/app/audits", icon: ClipboardList, label: "Audit Logs", end: false },
  { to: "/app/account", icon: UserCircle, label: "Account", end: false },
];

function roleBadgeClass(role: string) {
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === "ADMIN") return "role-badge admin";
  if (normalizedRole === "EDITOR") return "role-badge editor";
  return "role-badge user";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  });

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Link to="/app" className="brand" onClick={() => setSidebarOpen(false)}>
            <span className="brand-mark">
              <FileStack size={18} strokeWidth={2.4} />
            </span>
            <span>DocuTenant</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-email">{user?.email}</span>
              <span className={roleBadgeClass(user?.role || "user")}>
                {user?.role?.toUpperCase() || "USER"}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="topbar-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="topbar-title">
              <span className="topbar-page-name">
                {currentNav?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-company">
              <Building2 size={14} />
              {`Company #${user?.company_id || "-"}`}
            </span>
            <div className="topbar-user-chip">
              <span className="sidebar-avatar small">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="topbar-user-email">{user?.email}</span>
            </div>
            <button className="topbar-logout" onClick={logout} title="Logout">
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
