import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Product() {
  const { slug } = useParams();
  const [payload, setPayload] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => setPayload(r.data));
  }, [slug]);

  if (!payload) return <div className="wrap" style={{ padding: 40 }}><div className="skel" /></div>;
  const p = payload.product;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    offers: { '@type': 'Offer', priceCurrency: 'INR', price: Number(p.basePrice), availability: 'https://schema.org/InStock' },
  };

  async function addCart() {
    if (!user) return nav('/sign-in');
    await api.post('/cart/items', { productId: p.id, quantity: 1 });
    toast.push('Added to cart');
    nav('/cart');
  }

  return (
    <div className="wrap" style={{ padding: '32px 0 80px' }}>
      <Seo title={p.name} path={`/prebuild/${p.slug}`} description={p.subtitle || p.description} jsonLd={jsonLd} />
      <p className="muted">
        <Link to="/prebuild">Pre-builds</Link> / {p.name}
      </p>
      <div className="grid two">
        <div>
          {p.images?.[0] && <img src={p.images[0].url} alt={p.images[0].alt} />}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 12 }}>
            {p.images?.slice(1).map((img) => (
              <img key={img.id} src={img.url} alt={img.alt} loading="lazy" />
            ))}
          </div>
        </div>
        <div>
          <p className="badge">{p.tier}</p>
          <h1>{p.name}</h1>
          <p className="muted">{p.subtitle}</p>
          <p className="price" style={{ fontSize: 32 }}>
            {inr(p.basePrice)} <span className="muted" style={{ fontSize: 14 }}>ex-GST on invoice</span>
          </p>
          <p>{p.deliveryNote}</p>
          <p>{p.warrantyNote}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
            <button className="btn btn-primary" onClick={addCart}>
              Add to cart
            </button>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await addCart();
                nav('/checkout');
              }}
            >
              Buy now
            </button>
            <Link className="btn btn-ghost" to="/configure">
              Customize
            </Link>
          </div>
        </div>
      </div>
      <h2>Component breakdown</h2>
      <table className="table">
        <tbody>
          {p.components?.map((row) => (
            <tr key={row.id}>
              <td>{row.label || row.component.category.name}</td>
              <td>
                {row.component.brand} {row.component.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>About this build</h2>
      <p>{p.description}</p>
      <h2>Reviews</h2>
      {p.reviews?.length ? (
        p.reviews.map((rv) => (
          <article className="card" key={rv.id} style={{ marginBottom: 12 }}>
            <strong>
              {rv.user.profile?.firstName} · {rv.rating}/5
            </strong>
            <p>{rv.body}</p>
          </article>
        ))
      ) : (
        <p className="muted">No reviews yet.</p>
      )}
      <h2>FAQ</h2>
      {(p.faq || []).map((f) => (
        <details key={f.q} className="card" style={{ marginBottom: 8 }}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
      <h2>You may also like</h2>
      <div className="grid product-grid">
        {payload.related.map((r) => (
          <Link className="card" key={r.id} to={`/prebuild/${r.slug}`}>
            <h3>{r.name}</h3>
            <p className="price">{inr(r.basePrice)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
