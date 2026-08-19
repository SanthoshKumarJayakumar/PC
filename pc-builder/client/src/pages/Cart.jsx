import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../api';
import Seo from '../components/Seo';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [code, setCode] = useState('');

  async function load() {
    const { data } = await api.get('/cart');
    setCart(data.cart);
  }
  useEffect(() => {
    load();
  }, []);
  if (!cart) return <div className="wrap" style={{ padding: 40 }}>Loading cart…</div>;

  return (
    <div className="wrap grid two" style={{ padding: '40px 0' }}>
      <Seo title="Cart" path="/cart" />
      <div>
        <h1>Cart</h1>
        {cart.items.map((item) => (
          <article className="card" key={item.id} style={{ marginBottom: 10 }}>
            <strong>{item.product?.name || item.configuration?.name}</strong>
            <p>{item.savedForLater ? 'Saved for later' : `Qty ${item.quantity}`}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={async () => { await api.patch(`/cart/items/${item.id}`, { savedForLater: !item.savedForLater }); load(); }}>
                {item.savedForLater ? 'Move to cart' : 'Save for later'}
              </button>
              <button className="btn btn-danger" onClick={async () => { await api.delete(`/cart/items/${item.id}`); load(); }}>
                Remove
              </button>
            </div>
          </article>
        ))}
        {!cart.items.length && <p className="muted">Cart is empty.</p>}
      </div>
      <aside className="card">
        <h3>Summary</h3>
        <p>Subtotal {inr(cart.pricing.subtotal)}</p>
        <p>Discount {inr(cart.pricing.discount)}</p>
        <p>GST {inr(cart.pricing.gstAmount)}</p>
        <p>Delivery {inr(cart.pricing.deliveryFee)}</p>
        <p className="price">Total {inr(cart.pricing.total)}</p>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            await api.post('/cart/coupon', { code });
            load();
          }}
        >
          <input placeholder="Coupon" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-ghost">Apply</button>
        </form>
        <Link className="btn btn-primary" to="/checkout">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
