import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';
import { useToast } from '../context/ToastContext';

export default function MyConfig() {
  const [configs, setConfigs] = useState([]);
  const toast = useToast();
  const nav = useNavigate();

  async function load() {
    const { data } = await api.get('/configs');
    setConfigs(data.configs);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="My configs" path="/my-config" />
      <h1>My configs</h1>
      {configs.map((c) => (
        <article className="card" key={c.id} style={{ marginBottom: 12 }}>
          <h3>{c.name}</h3>
          <p className="price">{inr(c.total)} · {c.valid ? 'Compatible' : 'Needs fixes'}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                const name = prompt('Rename', c.name);
                if (name) {
                  await api.patch(`/configs/${c.id}`, { name });
                  load();
                }
              }}
            >
              Rename
            </button>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await api.post(`/configs/${c.id}/duplicate`);
                load();
              }}
            >
              Duplicate
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/share/${c.shareToken}`);
                toast.push('Share link copied');
              }}
            >
              Share
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await api.post('/cart/items', { configurationId: c.id });
                nav('/cart');
              }}
            >
              Add to cart
            </button>
            <Link className="btn btn-ghost" to={`/configure?config=${c.id}`}>
              Edit in builder
            </Link>
            <button
              className="btn btn-danger"
              onClick={async () => {
                await api.delete(`/configs/${c.id}`);
                load();
              }}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
      {!configs.length && <p className="muted">No saved builds yet.</p>}
    </div>
  );
}
