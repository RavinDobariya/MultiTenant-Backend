import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SkeletonBlock } from "./ui/Skeletons";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-shell">
          <SkeletonBlock className="skeleton-title" />
          <SkeletonBlock className="skeleton-line short" />
          <SkeletonBlock className="skeleton-card-tall" />
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
