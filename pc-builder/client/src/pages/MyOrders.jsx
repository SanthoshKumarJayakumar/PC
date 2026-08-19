import { useEffect, useState } from 'react';
import { api, inr } from '../api';
import Seo from '../components/Seo';

const STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'PARTS_ORDERED',
  'ASSEMBLING',
  'TESTING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data.orders));
  }, []);

  async function openOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    setOpen(data.order);
  }

  return (
    <div className="wrap" style={{ padding: '40px 0' }}>
      <Seo title="My orders" path="/my-orders" />
      <h1>My orders</h1>
      {orders.map((o) => (
        <button key={o.id} className="card" style={{ width: '100%', textAlign: 'left', marginBottom: 10 }} onClick={() => openOrder(o.id)}>
          <strong>{o.orderNumber}</strong>
          <p>
            {o.status} · {inr(o.total)}
          </p>
        </button>
      ))}
      {open && (
        <div className="modal-back" onClick={() => setOpen(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
            <h3>{open.orderNumber}</h3>
            <ol className="timeline">
              {open.history?.map((h) => (
                <li key={h.id}>
                  {h.status} — {new Date(h.createdAt).toLocaleString('en-IN')}
                  <div className="muted">{h.note}</div>
                </li>
              ))}
            </ol>
            <p className="muted">Pipeline: {STATUSES.join(' → ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
