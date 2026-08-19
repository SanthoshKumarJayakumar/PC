import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, inr } from '../api';
import Seo from '../components/Seo';

const personas = [
  { to: '/configure?intent=gaming', title: 'Gaming & streaming', copy: 'High refresh 1080p to 4K. Frame time first.' },
  { to: '/configure?intent=create', title: 'Content creation', copy: 'Encode, timeline, and 3D without thermal panic.' },
  { to: '/configure?intent=cad', title: 'Engineering work', copy: 'CAD, SIM, and multi-monitor boards.' },
  { to: '/configure?intent=data', title: 'Data & study', copy: 'Quiet boxes for notebooks, models, and classwork.' },
];

export default function Home() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api.get('/products', { params: { limit: 4 } }).then((r) => setProducts(r.data.items)).catch(() => setProducts([]));
  }, []);

  return (
    <>
      <Seo title="Home" path="/" />
      <section className="hero wrap grid two">
        <div>
          <p className="badge">India · INR · GST invoiced</p>
          <h1>Forge a machine that outlasts the trend cycle.</h1>
          <p className="muted" style={{ fontSize: 18, maxWidth: 560 }}>
            AetherForge is an original custom-PC studio. Configure every part with a real compatibility engine,
            or pick a pre-build. We assemble, stress-test, and ship pan-India.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link className="btn btn-primary" to="/configure">
              Start configuring
            </Link>
            <Link className="btn btn-ghost" to="/prebuild">
              Browse pre-builds
            </Link>
          </div>
        </div>
        <div className="hero-card" style={{ minHeight: 320, padding: 28 }}>
          <p className="muted">After you send a build</p>
          <ol className="timeline">
            <li>Compatibility lock & GST quote</li>
            <li>Parts allocated from inventory</li>
            <li>48-hour soak test</li>
            <li>Multi-layer pack, free delivery</li>
          </ol>
        </div>
      </section>
      <section className="wrap" style={{ padding: '24px 0 64px' }}>
        <h2>Pick a path</h2>
        <div className="grid product-grid">
          {personas.map((p) => (
            <Link key={p.to} className="persona card" to={p.to}>
              <strong>{p.title}</strong>
              <span className="muted">{p.copy}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <h2>Pre-builds in stock</h2>
          <Link to="/prebuild">View all</Link>
        </div>
        <div className="grid product-grid">
          {!products && [1, 2, 3, 4].map((i) => <div className="skel" key={i} />)}
          {products?.map((p) => (
            <Link key={p.id} className="card" to={`/prebuild/${p.slug}`}>
              {p.thumbnail && <img src={p.thumbnail.url} alt={p.thumbnail.alt} loading="lazy" />}
              <p className="badge">{p.tier}</p>
              <h3>{p.name}</h3>
              <p className="price">{inr(p.basePrice)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
