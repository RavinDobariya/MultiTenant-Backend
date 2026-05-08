import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import LandingPage from "../features/landing/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../features/dashboard/DashboardPage";
import DocumentsPage from "../features/documents/DocumentsPage";

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
      <Route path="/signup" element={<PlaceholderPage title="Signup" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/documents" element={<DocumentsPage />} />
          <Route path="/app/documents/:id" element={<PlaceholderPage title="Document Detail" />} />
          <Route path="/app/units" element={<PlaceholderPage title="Units" />} />
          <Route path="/app/company" element={<PlaceholderPage title="Company" />} />
          <Route path="/app/audits" element={<PlaceholderPage title="Audit Logs" />} />
          <Route path="/app/account" element={<PlaceholderPage title="Account" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
