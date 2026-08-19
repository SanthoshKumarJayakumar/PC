import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Protected({ children, role }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="wrap" style={{ padding: 40 }}>Loading session…</div>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: loc.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}
