import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('gallery');
  useEffect(() => {
    api.get('/gallery').then((r) => setItems(r.data.items));
  }, []);
  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="Gallery" path="/gallery" />
      <h1>Gallery</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        {['gallery', 'wallpaper'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid gallery-grid" style={{ marginTop: 24 }}>
        {items.filter((i) => i.kind === tab).map((i) => (
          <figure className="card" key={i.id}>
            <img src={i.imageUrl} alt={i.title} loading="lazy" />
            <figcaption>
              <strong>{i.title}</strong>
              <p className="muted">{i.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
