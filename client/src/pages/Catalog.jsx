import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../services/api.js";
import { useBuildStore } from "../store/buildStore.js";
import { Seo } from "../components/Seo.jsx";
import { SharedViewer } from "./SharedViewer.jsx";
import { GlareCard, Reveal, Stagger } from "../motion/Motion.jsx";

function useMinBusy(busy, ms = 450) {
  const [show, setShow] = useState(busy);
  const started = useRef(0);
  useEffect(() => {
    if (busy) {
      started.current = Date.now();
      setShow(true);
      return undefined;
    }
    const wait = Math.max(0, ms - (Date.now() - started.current));
    const t = window.setTimeout(() => setShow(false), wait);
    return () => window.clearTimeout(t);
  }, [busy, ms]);
  return show;
}

function CatalogSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading components">
      {Array.from({ length: count }, (_, i) => (
        <article className="product-card skeleton-card" key={i}>
          <span className="skeleton-line wide" />
          <span className="skeleton-line mid" />
          <span className="skeleton-line price" />
          <span className="skeleton-line btn" />
        </article>
      ))}
    </div>
  );
}

export function Prebuilt() {
  const nav = useNavigate();
  const load = useBuildStore((s) => s.loadFromConfig);
  const q = useQuery({ queryKey: ["prebuilt"], queryFn: async () => (await api.get("/configurations/prebuilt")).data.data.items });

  return (
    <div className="page">
      <Seo title="Pre-built systems" />
      <Reveal>
        <h1>Pre-built systems</h1>
        <p className="muted">Starter, Apex, Studio, and Vector — all editable in the 3D builder.</p>
      </Reveal>
      <Stagger className="grid" delay={0.09} onView={false} style={{ padding: 0, marginTop: 20 }}>
        {(q.data || []).map((b) => (
            <GlareCard key={b.id}>
            <article className="machine-card">
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
            </GlareCard>
        ))}
      </Stagger>
    </div>
  );
}

export function ComponentsPage() {
  const [cat, setCat] = useState("gpu");
  const q = useQuery({
    queryKey: ["cat", cat],
    queryFn: async () => (await api.get("/components", { params: { category: cat, pageSize: 40 } })).data.data,
    placeholderData: keepPreviousData,
  });
  const items = q.data?.items || [];
  const loading = useMinBusy(q.isFetching);
  return (
    <div className="page">
      <Seo title="Components" />
      <Reveal>
        <h1>Components</h1>
      </Reveal>
      <div className="filters">
        {(q.data?.categories || []).map((c) => (
          <button
            key={c.slug}
            className={c.slug === cat ? "btn-primary" : "btn"}
            aria-pressed={c.slug === cat}
            onClick={() => setCat(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>
      {q.isError && <div className="alert error">Could not load components. Check that the API is running.</div>}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <CatalogSkeleton />
          </motion.div>
        ) : items.length === 0 ? (
          <motion.p key="empty" className="muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            No parts in this category yet.
          </motion.p>
        ) : (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stagger className="grid" delay={0.06} onView={false}>
              {items.map((c) => (
                <GlareCard key={c.id}>
                  <article className="product-card">
                    <h3>{c.name}</h3>
                    <p className="muted">{c.brand} · {c.sku}</p>
                    <p className="price">₹{Number(c.price).toLocaleString("en-IN")}</p>
                    <Link className="btn" to="/builder">Configure</Link>
                  </article>
                </GlareCard>
              ))}
            </Stagger>
          </motion.div>
        )}
      </AnimatePresence>
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
      <div className="gallery-stage">
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

