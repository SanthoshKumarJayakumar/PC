import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STEPS = [
  ['cpu', 'Processor'],
  ['motherboard', 'Motherboard'],
  ['ram', 'Memory'],
  ['gpu', 'Graphics'],
  ['storage', 'Storage'],
  ['cabinet', 'Cabinet'],
  ['psu', 'Power'],
  ['cooling', 'Cooling'],
  ['os', 'OS'],
  ['network', 'Wi-Fi'],
  ['accessory', 'Extras'],
  ['warranty', 'Warranty'],
  ['review', 'Review'],
];

export default function Configure() {
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState({});
  const [result, setResult] = useState(null);
  const [name, setName] = useState('Untitled forge');
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const slug = STEPS[step][0];

  useEffect(() => {
    api.get('/components').then((r) => setCatalog(r.data.items));
  }, []);

  useEffect(() => {
    const id = params.get('config');
    if (!id || !user) return;
    let cancelled = false;
    api
      .get(`/configs/${id}`)
      .then(({ data }) => {
        if (cancelled || !data.config) return;
        const next = {};
        for (const row of data.config.parts || []) {
          const cat = row.slot || row.component?.category?.slug;
          if (!cat || !row.component) continue;
          const item = {
            ...row.component,
            category: row.component.category,
          };
          if (!next[cat]) next[cat] = [];
          next[cat].push(item);
        }
        setSelected(next);
        setName(data.config.name || 'Untitled forge');
        setEditingId(data.config.id);
      })
      .catch(() => {
        toast.push('Could not load that saved build.');
      });
    return () => {
      cancelled = true;
    };
  }, [params, user, toast]);

  const selections = useMemo(
    () =>
      Object.values(selected)
        .flat()
        .filter(Boolean)
        .map((c) => ({ componentId: c.id, quantity: 1, slot: c.category?.slug })),
    [selected]
  );

  useEffect(() => {
    if (!selections.length) return;
    const t = setTimeout(() => {
      api.post('/components/validate', { selections }).then((r) => setResult(r.data));
    }, 200);
    return () => clearTimeout(t);
  }, [selections]);

  const options = catalog.filter((c) => c.category?.slug === slug);
  const total = result?.pricing?.total || 0;

  function pick(item) {
    setSelected((s) => {
      if (slug === 'storage') {
        const list = s.storage || [];
        const exists = list.find((x) => x.id === item.id);
        return { ...s, storage: exists ? list.filter((x) => x.id !== item.id) : [...list, item] };
      }
      return { ...s, [slug]: [item] };
    });
  }

  async function save(addToCart) {
    if (!user) return nav('/sign-in');
    if (result && !result.valid) {
      toast.push('Fix compatibility errors before saving.');
      return;
    }
    if (editingId) {
      const { data } = await api.patch(`/configs/${editingId}`, { name, selections });
      toast.push('Build updated');
      if (addToCart) {
        await api.post('/cart/items', { configurationId: data.config.id });
        nav('/cart');
      } else nav('/my-config');
      return;
    }
    const { data } = await api.post('/configs', { name, selections });
    toast.push('Build saved');
    if (addToCart) {
      await api.post('/cart/items', { configurationId: data.config.id });
      nav('/cart');
    } else nav('/my-config');
  }

  return (
    <div className="wrap" style={{ padding: '32px 0 120px' }}>
      <Seo title="Configure" path="/configure" />
      <h1>Configure</h1>
      <div className="steps">
        {STEPS.map(([id, label], i) => (
          <button key={id} className={`btn ${i === step ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStep(i)}>
            {i + 1}. {label}
          </button>
        ))}
      </div>
      <div className="grid two" style={{ marginTop: 24 }}>
        <div>
          {slug !== 'review' ? (
            <div className="grid">
              {options.map((item) => (
                <button
                  key={item.id}
                  className="card"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    outline:
                      (selected[slug] || []).some((x) => x.id === item.id) ? '2px solid var(--accent)' : undefined,
                  }}
                  onClick={() => pick(item)}
                >
                  <strong>
                    {item.brand} {item.name}
                  </strong>
                  <p className="muted">{item.description}</p>
                  <p className="price">{inr(item.price)}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="card">
              <label>
                Build name
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <p className="muted">OS, Wi-Fi, accessories, and warranty plans are optional extras — pick them from earlier categories if listed.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => save(false)}>
                  Save build
                </button>
                <button className="btn btn-primary" onClick={() => save(true)}>
                  Add to cart
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
            <button className="btn btn-primary" disabled={step === STEPS.length - 1} onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          </div>
        </div>
        <aside className="card summary-sticky">
          <h3>Live quote</h3>
          {result?.parts?.map((p) => (
            <p key={p.id}>
              {p.name} <span className="muted">{inr(p.price)}</span>
            </p>
          ))}
          {result?.pricing && (
            <>
              <p>Subtotal {inr(result.pricing.subtotal)}</p>
              <p>GST {inr(result.pricing.gstAmount)}</p>
              <p className="price">Total {inr(result.pricing.total)}</p>
            </>
          )}
          {result?.compatibility?.errors?.map((e) => (
            <p className="error" key={e.code}>
              {e.message}
            </p>
          ))}
          {result?.compatibility?.warnings?.map((e) => (
            <p className="warn" key={e.code}>
              {e.message}
            </p>
          ))}
        </aside>
      </div>
      <div className="mobile-bar">
        <strong>View build — {inr(total)}</strong>
        <button className="btn btn-primary" onClick={() => setStep(STEPS.length - 1)}>
          Review
        </button>
      </div>
    </div>
  );
}
