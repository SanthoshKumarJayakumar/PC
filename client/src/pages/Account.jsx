import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Seo } from "../components/Seo.jsx";

export function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <Seo title="Dashboard" />
      <h1>Hello, {user?.firstName}</h1>
      <div className="grid" style={{ padding: 0 }}>
        <Link className="panel" to="/dashboard/builds">My builds</Link>
        <Link className="panel" to="/dashboard/orders">Orders</Link>
        <Link className="panel" to="/dashboard/profile">Profile</Link>
        <Link className="panel" to="/dashboard/support">Support</Link>
      </div>
    </div>
  );
}

export function BuildsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["builds"], queryFn: async () => (await api.get("/configurations")).data.data.items });
  return (
    <div className="page">
      <Seo title="Saved builds" />
      <h1>Saved builds</h1>
      {!(q.data || []).length && <p className="muted">No saved builds yet.</p>}
      {(q.data || []).map((b) => (
        <article className="panel" key={b.id}>
          <div className="row">
            <strong>{b.name}</strong>
            <span className="price">₹{Number(b.pricing?.total || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="cta-row">
            <Link className="btn" to={`/builder?config=${b.id}`}>Edit</Link>
            <Link className="btn" to={`/build/${b.shareId}`}>Share</Link>
            <button className="btn" onClick={async () => { await api.post(`/configurations/${b.id}/duplicate`); qc.invalidateQueries({ queryKey: ["builds"] }); }}>Duplicate</button>
            <button className="btn-ghost" onClick={async () => { await api.delete(`/configurations/${b.id}`); qc.invalidateQueries({ queryKey: ["builds"] }); }}>Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function OrdersPage() {
  const q = useQuery({ queryKey: ["orders"], queryFn: async () => (await api.get("/orders")).data.data.items });
  return (
    <div className="page">
      <Seo title="Orders" />
      <h1>Orders</h1>
      {(q.data || []).map((o) => (
        <Link className="panel row" key={o.id} to={`/order/${o.id}`}>
          <span>{o.orderNumber}</span>
          <span>{o.status}</span>
          <span>₹{Number(o.total).toLocaleString("en-IN")}</span>
        </Link>
      ))}
    </div>
  );
}

const FLOW = ["ORDER_RECEIVED", "CONFIGURATION_REVIEW", "ASSEMBLY", "TESTING", "QUALITY_CHECK", "PACKAGING", "SHIPPED", "DELIVERED"];

export function OrderDetail() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["order", id], queryFn: async () => (await api.get(`/orders/${id}`)).data.data });
  if (!q.data) return <div className="page muted">Loading order…</div>;
  return (
    <div className="page">
      <Seo title={q.data.orderNumber} />
      <h1>{q.data.orderNumber}</h1>
      <p>Status {q.data.status} · Payment {q.data.paymentStatus}</p>
      <div className="timeline">
        {FLOW.map((s) => (
          <div className="row" key={s}>
            <span className="dot" style={{ opacity: FLOW.indexOf(q.data.status) >= FLOW.indexOf(s) ? 1 : 0.25 }} />
            <span>{s.replaceAll("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <Seo title="Profile" />
      <h1>Profile</h1>
      <p>{user?.firstName} {user?.lastName}</p>
      <p className="muted">{user?.email}</p>
    </div>
  );
}

export function SupportPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tickets"], queryFn: async () => (await api.get("/support/tickets")).data.data.items });
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post("/support/tickets", { category: fd.get("category"), subject: fd.get("subject"), description: fd.get("description") });
    qc.invalidateQueries({ queryKey: ["tickets"] });
    e.target.reset();
  }
  return (
    <div className="page">
      <Seo title="Support" />
      <h1>Support</h1>
      <form className="form" onSubmit={onSubmit}>
        <select name="category"><option>general</option><option>order</option><option>build</option></select>
        <input name="subject" placeholder="Subject" required />
        <textarea name="description" placeholder="How can we help?" />
        <button className="btn-primary">Create ticket</button>
      </form>
      {(q.data || []).map((t) => (
        <article className="panel" key={t.id}><strong>{t.subject}</strong> <span className="muted">{t.status}</span></article>
      ))}
    </div>
  );
}
