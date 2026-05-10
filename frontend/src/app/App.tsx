import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import SignupPage from "../features/auth/SignupPage";
import LandingPage from "../features/landing/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../features/dashboard/DashboardPage";
import DocumentsPage from "../features/documents/DocumentsPage";
import DocumentDetailPage from "../features/documents/DocumentDetailPage";
import UnitsPage from "../features/units/UnitsPage";
import CompanyPage from "../features/company/CompanyPage";
import AuditLogsPage from "../features/audits/AuditLogsPage";
import AccountPage from "../features/account/AccountPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page-placeholder">
      <h1>{title}</h1>
      <p>This section is under construction. Coming in the next slice.</p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/documents" element={<DocumentsPage />} />
          <Route path="/app/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/app/units" element={<UnitsPage />} />
          <Route path="/app/company" element={<CompanyPage />} />
          <Route path="/app/audits" element={<AuditLogsPage />} />
          <Route path="/app/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
