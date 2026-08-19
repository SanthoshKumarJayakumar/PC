import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: 'hardware', subject: '', body: '' });
  const [file, setFile] = useState(null);

  async function load() {
    const { data } = await api.get('/support');
    setTickets(data.tickets);
  }
  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);
    await api.post('/support', fd);
    setForm({ category: 'hardware', subject: '', body: '' });
    load();
  }

  return (
    <div className="wrap grid two" style={{ padding: '40px 0' }}>
      <Seo title="Support" path="/support" />
      <form className="form card" onSubmit={onSubmit}>
        <h2>New ticket</h2>
        <label>
          Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="hardware">Hardware</option>
            <option value="order">Order</option>
            <option value="warranty">Warranty</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Subject
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        </label>
        <label>
          Details
          <textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button className="btn btn-primary">Submit</button>
      </form>
      <div>
        <h2>Your tickets</h2>
        {tickets.map((t) => (
          <article className="card" key={t.id} style={{ marginBottom: 10 }}>
            <strong>
              {t.ticketNo} · {t.status}
            </strong>
            <p>{t.subject}</p>
            {t.messages?.map((m) => (
              <p key={m.id} className="muted">
                {m.body}
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
