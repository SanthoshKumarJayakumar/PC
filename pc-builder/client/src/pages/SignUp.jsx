import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

export default function SignUp() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await register(form);
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Could not create account');
    }
  }

  return (
    <div className="wrap" style={{ padding: '48px 0', maxWidth: 480 }}>
      <Seo title="Sign up" path="/sign-up" />
      <h1>Create your forge account</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          First name
          <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </label>
        <label>
          Last name
          <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label>
          Mobile
          <input required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
          />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-primary">Create account</button>
        <p>
          Already have one? <Link to="/sign-in">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
