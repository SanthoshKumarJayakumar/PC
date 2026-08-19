import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useBuildStore } from "../store/buildStore.js";
import { Seo } from "../components/Seo.jsx";
import { SharedViewer } from "./SharedViewer.jsx";

export function Prebuilt() {
  const nav = useNavigate();
  const load = useBuildStore((s) => s.loadFromConfig);
  const q = useQuery({ queryKey: ["prebuilt"], queryFn: async () => (await api.get("/configurations/prebuilt")).data.data.items });

  return (
    <div className="page">
      <Seo title="Pre-built systems" />
      <h1>Pre-built systems</h1>
      <p className="muted">Starter, Apex, Studio, and Vector — all editable in the 3D builder.</p>
      <div className="grid" style={{ padding: 0, marginTop: 20 }}>
        {(q.data || []).map((b) => (
            <article className="machine-card" key={b.id}>
              <div className="machine-visual">
                <span className="eyebrow">{b.prebuiltCategory}</span>
              </div>
              <h3>{b.name}</h3>
              <ul className="spec-list">
                {b.parts.filter((p) => ["cpu", "gpu", "ram", "storage"].includes(p.slot)).map((p) => (
                  <li key={p.slot}>{p.component.name}</li>
                ))}
              </ul>
              <p className="price">₹{Number(b.pricing?.total || 0).toLocaleString("en-IN")}</p>
              <div className="cta-row">
                <button className="btn" onClick={() => { load(b); nav("/builder"); }}>VIEW IN 3D</button>
                <button className="btn-primary" onClick={() => { load(b); nav("/builder"); }}>CUSTOMIZE</button>
              </div>
            </article>
        ))}
      </div>
    </div>
  );
}

export function ComponentsPage() {
  const [cat, setCat] = useState("gpu");
  const q = useQuery({
    queryKey: ["cat", cat],
    queryFn: async () => (await api.get("/components", { params: { category: cat, pageSize: 40 } })).data.data,
  });
  return (
    <div className="page">
      <Seo title="Components" />
      <h1>Components</h1>
      <div className="filters">
        {(q.data?.categories || []).map((c) => (
          <button key={c.slug} className={c.slug === cat ? "btn-primary" : "btn"} onClick={() => setCat(c.slug)}>{c.name}</button>
        ))}
      </div>
      <div className="grid" style={{ padding: 0 }}>
        {(q.data?.items || []).map((c) => (
          <article className="product-card" key={c.id}>
            <h3>{c.name}</h3>
            <p className="muted">{c.brand} · {c.sku}</p>
            <p className="price">₹{Number(c.price).toLocaleString("en-IN")}</p>
            <Link className="btn" to="/builder">Configure</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ShareBuild() {
  const { shareId } = useParams();
  const nav = useNavigate();
  const load = useBuildStore((s) => s.loadFromConfig);
  const q = useQuery({
    queryKey: ["share", shareId],
    queryFn: async () => (await api.get(`/configurations/share/${shareId}`)).data.data,
  });

  if (q.isError) return <div className="page">Build not found.</div>;
  if (!q.data) return <div className="page muted">Loading shared build…</div>;

  return (
    <div className="page">
      <Seo title={q.data.name} />
      <h1>{q.data.name}</h1>
      <p className="price">₹{Number(q.data.pricing?.total || 0).toLocaleString("en-IN")}</p>
      <div style={{ height: 420, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        <SharedViewer cfg={q.data} />
      </div>
      <div className="cta-row">
        <button
          className="btn"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          COPY BUILD LINK
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            load(q.data);
            nav("/builder");
          }}
        >
          COPY THIS BUILD
        </button>
      </div>
    </div>
  );
}

