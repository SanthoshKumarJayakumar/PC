import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';

export default function Shared() {
  const { token } = useParams();
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api.get(`/configs/shared/${token}`).then((r) => setConfig(r.data.config));
  }, [token]);
  if (!config) return <div className="wrap" style={{ padding: 40 }}>Loading shared build…</div>;
  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title={config.name} path={`/share/${token}`} />
      <h1>{config.name}</h1>
      <p className="price">{inr(config.total)}</p>
      <ul>
        {config.parts.map((p) => (
          <li key={p.id}>
            {p.component.category.name}: {p.component.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
