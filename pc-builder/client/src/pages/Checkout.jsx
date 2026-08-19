import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Seo from '../components/Seo';
import { useToast } from '../context/ToastContext';

export default function Checkout() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    method: 'TEST',
  });
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const toast = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/checkout', form);
      if (form.method === 'TEST') {
        await api.post(`/checkout/${data.order.id}/verify`, {});
      }
      toast.push(`Order ${data.order.orderNumber} placed`);
      nav('/my-orders');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Checkout failed');
    }
  }

  return (
    <div className="wrap" style={{ padding: '40px 0', maxWidth: 560 }}>
      <Seo title="Checkout" path="/checkout" />
      <h1>Checkout</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          Full name
          <input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </label>
        <label>
          Phone
          <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label>
          Address
          <input required value={form.line1} onChange={(e) => set('line1', e.target.value)} />
        </label>
        <label>
          City
          <input required value={form.city} onChange={(e) => set('city', e.target.value)} />
        </label>
        <label>
          State
          <input required value={form.state} onChange={(e) => set('state', e.target.value)} />
        </label>
        <label>
          PIN code
          <input required value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
        </label>
        <label>
          Payment
          <select value={form.method} onChange={(e) => set('method', e.target.value)}>
            <option value="TEST">Test payment (dev)</option>
            <option value="COD">Cash on delivery</option>
          </select>
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-primary">Place order</button>
        <p className="muted">GST and delivery are calculated from your cart. Invalid custom builds are blocked by the server.</p>
      </form>
    </div>
  );
}
