import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function LeadForm() {
  const toast = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', mobile: '', location: '' });
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/leads', form);
      toast.push('Thanks — a specialist will reach out shortly.');
      setForm({ firstName: '', lastName: '', mobile: '', location: '' });
    } catch (err) {
      toast.push(err.response?.data?.error || 'Could not submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form card" onSubmit={onSubmit}>
      <strong>Talk to a build specialist</strong>
      <label>
        First name
        <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
      </label>
      <label>
        Last name
        <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
      </label>
      <label>
        Mobile
        <input required inputMode="numeric" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
      </label>
      <label>
        Location
        <input required value={form.location} onChange={(e) => set('location', e.target.value)} />
      </label>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Sending…' : 'Request a callback'}
      </button>
    </form>
  );
}
