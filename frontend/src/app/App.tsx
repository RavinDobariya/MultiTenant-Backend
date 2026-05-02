import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import LandingPage from "../features/landing/LandingPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="placeholder-page">
      <a href="/" className="brand-link">DocuTenant</a>
      <section className="placeholder-panel">
        <p className="eyebrow">Coming next</p>
        <h1>{title}</h1>
        <p>
          This route is reserved for the next frontend slice. The landing page
          is the current review target.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<PlaceholderPage title="Signup" />} />
      <Route path="/app" element={<PlaceholderPage title="Dashboard" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
