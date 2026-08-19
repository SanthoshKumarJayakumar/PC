import { useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    await api.post('/auth/forgot-password', { email });
    setDone(true);
  }
  return (
    <div className="wrap" style={{ padding: 48, maxWidth: 440 }}>
      <Seo title="Forgot password" path="/forgot-password" />
      <h1>Forgot password</h1>
      {done ? (
        <p>If that inbox exists, we sent reset instructions. In local dev the link is printed on the API console.</p>
      ) : (
        <form className="form card" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className="btn btn-primary">Send reset link</button>
        </form>
      )}
    </div>
  );
}
