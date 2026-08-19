import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, inr } from '../../api';
import Seo from '../../components/Seo';

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setS(r.data));
  }, []);
  if (!s) return <p>Loading…</p>;
  return (
    <div>
      <h2>Overview</h2>
      <div className="grid product-grid">
        <div className="card">Users {s.users}</div>
        <div className="card">Orders {s.orders}</div>
        <div className="card">Open tickets {s.openTickets}</div>
        <div className="card">Revenue {inr(s.revenue)}</div>
      </div>
    </div>
  );
}

function Products() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/products').then((r) => setRows(r.data.products));
  }, []);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Live</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{inr(p.basePrice)}</td>
            <td>
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  await api.patch(`/admin/products/${p.id}`, { isPublished: !p.isPublished });
                  const { data } = await api.get('/admin/products');
                  setRows(data.products);
                }}
              >
                {p.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Components() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/components').then((r) => setRows(r.data.components));
  }, []);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Name</th>
          <th>Price</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.id}>
            <td>{c.sku}</td>
            <td>{c.name}</td>
            <td>{inr(c.price)}</td>
            <td>{String(c.isActive)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Compatibility() {
  const [rules, setRules] = useState([]);
  useEffect(() => {
    api.get('/admin/compatibility').then((r) => setRules(r.data.rules));
  }, []);
  return (
    <div>
      <p className="muted">
        Primary validation is spec-driven (socket, DDR, clearance, PSU). Optional override rows:
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Rule</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>{r.from.name}</td>
              <td>{r.to.name}</td>
              <td>{r.ruleKey}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/orders').then((r) => setRows(r.data.orders));
  }, []);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Number</th>
          <th>Status</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td>{o.orderNumber}</td>
            <td>{o.status}</td>
            <td>{inr(o.total)}</td>
            <td>
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  const status = prompt('New status', o.status);
                  if (status) {
                    await api.patch(`/admin/orders/${o.id}`, { status, note: 'Admin update' });
                    const { data } = await api.get('/admin/orders');
                    setRows(data.orders);
                  }
                }}
              >
                Advance
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Users() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/users').then((r) => setRows(r.data.users));
  }, []);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((u) => (
          <tr key={u.id}>
            <td>{u.email}</td>
            <td>{u.role}</td>
            <td>{String(u.isActive)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Inventory() {
  const [qty, setQty] = useState('10');
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState([]);
  useEffect(() => {
    api.get('/admin/products').then((r) => setProducts(r.data.products));
  }, []);
  return (
    <form
      className="form card"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post('/admin/inventory', { productId, quantity: Number(qty), reason: 'RESTOCK' });
        alert('Inventory row added');
      }}
    >
      <h3>Restock</h3>
      <label>
        Product
        <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
          <option value="">Select</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity delta
        <input value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <button className="btn btn-primary">Apply</button>
    </form>
  );
}

function Tickets() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/support').then((r) => setRows(r.data.tickets));
  }, []);
  return (
    <div>
      {rows.map((t) => (
        <article className="card" key={t.id} style={{ marginBottom: 10 }}>
          <strong>
            {t.ticketNo} · {t.subject} · {t.status}
          </strong>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              const body = prompt('Reply');
              if (body) {
                await api.post(`/admin/support/${t.id}/reply`, { body, status: 'IN_PROGRESS' });
                const { data } = await api.get('/admin/support');
                setRows(data.tickets);
              }
            }}
          >
            Reply
          </button>
        </article>
      ))}
    </div>
  );
}

export default function Admin() {
  return (
    <div className="admin-shell">
      <Seo title="Admin" path="/admin" />
      <aside className="admin-side">
        <h3>Admin</h3>
        <nav className="nav-links" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <NavLink to="/admin" end>
            Stats
          </NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/components">Components</NavLink>
          <NavLink to="/admin/compatibility">Compatibility</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/support">Support</NavLink>
          <NavLink to="/admin/inventory">Inventory</NavLink>
          <NavLink to="/">Storefront</NavLink>
        </nav>
      </aside>
      <div style={{ padding: 24 }}>
        <Routes>
          <Route index element={<Stats />} />
          <Route path="products" element={<Products />} />
          <Route path="components" element={<Components />} />
          <Route path="compatibility" element={<Compatibility />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="support" element={<Tickets />} />
          <Route path="inventory" element={<Inventory />} />
        </Routes>
      </div>
    </div>
  );
}
