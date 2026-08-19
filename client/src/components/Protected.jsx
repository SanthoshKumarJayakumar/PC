import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Protected({ children, role }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page muted">Loading session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
