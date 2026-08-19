import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export default function Faq() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/faq').then((r) => setItems(r.data.items));
  }, []);
  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="FAQ" path="/faq" />
      <h1>FAQ</h1>
      {items.map((i) => (
        <details className="card" key={i.id} style={{ marginBottom: 10 }}>
          <summary>{i.question}</summary>
          <p>{i.answer}</p>
        </details>
      ))}
    </div>
  );
}
