import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Reset() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  async function onSubmit(e) {
    e.preventDefault();
    await api.post('/auth/reset-password', { token: params.get('token'), password });
    nav('/sign-in');
  }
  return (
    <div className="wrap" style={{ padding: 48, maxWidth: 440 }}>
      <Seo title="Reset password" path="/reset-password" />
      <h1>Choose a new password</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          New password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        <button className="btn btn-primary">Update password</button>
      </form>
    </div>
  );
}
