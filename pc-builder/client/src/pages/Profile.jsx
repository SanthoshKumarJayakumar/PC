import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Profile() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', location: '' });
  useEffect(() => {
    api.get('/profile').then((r) => {
      setData(r.data);
      setForm({
        firstName: r.data.user.profile?.firstName || '',
        lastName: r.data.user.profile?.lastName || '',
        location: r.data.user.profile?.location || '',
      });
    });
  }, []);
  if (!data) return <div className="wrap" style={{ padding: 40 }}>Loading…</div>;
  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="Profile" path="/profile" />
      <h1>Profile</h1>
      <form
        className="form card"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.patch('/profile', form);
        }}
      >
        <p className="muted">{data.user.email} · {data.user.mobile}</p>
        <label>
          First name
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </label>
        <label>
          Last name
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </label>
        <button className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
