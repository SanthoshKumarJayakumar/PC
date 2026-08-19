import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';

export default function Prebuild() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const query = useMemo(
    () => ({
      q: params.get('q') || '',
      category: params.get('category') || '',
      sort: params.get('sort') || 'featured',
      page: params.get('page') || 1,
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      cpu: params.get('cpu') || '',
      gpu: params.get('gpu') || '',
      ram: params.get('ram') || '',
      storage: params.get('storage') || '',
    }),
    [params]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/products', { params: { ...query, kind: 'PREBUILD' } }).then((r) => setData(r.data));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function set(k, v) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  }

  return (
    <div className="wrap" style={{ padding: '40px 0 80px' }}>
      <Seo title="Pre-builds" path="/prebuild" />
      <h1>Pre-builds</h1>
      <p className="muted">Filter, sort, and paginate systems from the live catalogue.</p>
      <div className="filters">
        <input placeholder="Search" defaultValue={query.q} onChange={(e) => set('q', e.target.value)} />
        <select value={query.sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="featured">Featured</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="newest">Newest</option>
        </select>
        <input placeholder="CPU brand" defaultValue={query.cpu} onChange={(e) => set('cpu', e.target.value)} />
        <input placeholder="GPU" defaultValue={query.gpu} onChange={(e) => set('gpu', e.target.value)} />
        <input placeholder="RAM" defaultValue={query.ram} onChange={(e) => set('ram', e.target.value)} />
        <input placeholder="Storage" defaultValue={query.storage} onChange={(e) => set('storage', e.target.value)} />
        <input placeholder="Min ₹" defaultValue={query.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
        <input placeholder="Max ₹" defaultValue={query.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
      </div>
      {!data && <div className="skel" />}
      <div className="grid product-grid">
        {data?.items.map((p) => (
          <Link className="card" key={p.id} to={`/prebuild/${p.slug}`}>
            {p.thumbnail && <img src={p.thumbnail.url} alt="" loading="lazy" />}
            <p className="badge">{p.tier || p.kind}</p>
            <h3>{p.name}</h3>
            <p className="price">{inr(p.basePrice)}</p>
            <p className="muted">{p.stock > 0 ? `${p.stock} in stock` : 'Made to order'}</p>
          </Link>
        ))}
      </div>
      {data && (
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {Array.from({ length: data.pages }, (_, i) => (
            <button key={i} className="btn btn-ghost" onClick={() => set('page', String(i + 1))}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
