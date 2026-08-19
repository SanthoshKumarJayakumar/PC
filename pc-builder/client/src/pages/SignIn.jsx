import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';
import { useToast } from '../context/ToastContext';

export default function SignIn() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.push('Welcome back');
      nav(loc.state?.from || '/dashboard');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Sign-in failed');
    }
  }

  return (
    <div className="wrap" style={{ padding: '48px 0', maxWidth: 440 }}>
      <Seo title="Sign in" path="/sign-in" />
      <h1>Welcome back</h1>
      <p className="muted">Sign in to save builds, track orders, and open tickets.</p>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-primary">Sign in</button>
        <p>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p>
          New here? <Link to="/sign-up">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
