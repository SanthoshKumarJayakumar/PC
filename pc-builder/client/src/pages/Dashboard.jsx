import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="Dashboard" path="/dashboard" />
      <h1>Hello, {user.profile?.firstName}</h1>
      <div className="grid product-grid">
        <Link className="card" to="/my-config">
          My configs
        </Link>
        <Link className="card" to="/my-orders">
          My orders
        </Link>
        <Link className="card" to="/support">
          Support
        </Link>
        <Link className="card" to="/profile">
          Profile
        </Link>
        <Link className="card" to="/cart">
          Cart
        </Link>
        <Link className="card" to="/configure">
          New build
        </Link>
      </div>
    </div>
  );
}
