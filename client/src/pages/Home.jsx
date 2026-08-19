import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useBuildStore } from "../store/buildStore.js";
import { Seo } from "../components/Seo.jsx";
import { PCViewer } from "../three/PCViewer/PCViewer.jsx";

const PROCESS = [
  ["01", "Configuration", "Pick every part in 3D. Compatibility and wattage update live."],
  ["02", "Consultation", "We review thermals, noise, and the parts you chose."],
  ["03", "Assembly & testing", "Built, burned in, and checked before it leaves the bench."],
  ["04", "Packaging", "Double-boxed, foam-braced, ready for Indian logistics."],
  ["05", "Delivery", "Tracked shipping with setup notes in the crate."],
];

const FAQS = [
  ["Can I see the PC before buying?", "Yes. The builder shows a full assembled machine. Swap GPU, RAM, cooler, or case and the 3D model updates immediately."],
  ["What if parts are incompatible?", "Checkout is blocked until the server-side rules pass — socket, memory generation, GPU length, PSU headroom, cooler height."],
  ["Do you assemble in India?", "Kaelon systems are configured, assembled, and tested locally. Pricing includes GST."],
  ["Can I start from a pre-built?", "Open any pre-built, then Customize — it loads the exact parts into the 3D builder."],
];

export function Home() {
  const nav = useNavigate();
  const load = useBuildStore((s) => s.loadFromConfig);
  const pre = useQuery({ queryKey: ["prebuilt"], queryFn: async () => (await api.get("/configurations/prebuilt")).data.data.items });
  const [openFaq, setOpenFaq] = useState(0);

  function spec(build, slot) {
    return build.parts?.find((p) => p.slot === slot)?.component?.name || "—";
  }

  return (
    <>
      <Seo title="Custom PCs in 3D" description="Configure every component. See it in 3D. Build without compromises." />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">KAELON · INDIA</p>
          <h1>BUILD YOUR PERFECT MACHINE</h1>
          <p>Configure every component. See it in 3D. Build without compromises.</p>
          <div className="cta-row">
            <Link className="btn-primary" to="/builder">START BUILDING</Link>
            <Link className="btn" to="/prebuilt">EXPLORE PRE-BUILTS</Link>
          </div>
          <dl className="hero-stats">
            <div><dt>Live 3D</dt><dd>Glass-side inspection</dd></div>
            <div><dt>GST inclusive</dt><dd>Server-side pricing</dd></div>
            <div><dt>Compatibility</dt><dd>Socket · RAM · PSU</dd></div>
          </dl>
        </div>
        <div className="hero-3d">
          <PCViewer autoRotate />
          <p className="viewer-caption muted">Drag to orbit · scroll to zoom</p>
        </div>
      </section>

      <section className="section">
        <h2>How a Kaelon build is made</h2>
        <div className="process">
          {PROCESS.map(([n, t, d]) => (
            <article key={n} className="process-card">
              <span className="eyebrow">{n}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="row">
          <h2>Featured machines</h2>
          <Link to="/prebuilt">View all</Link>
        </div>
        <div className="product-grid">
          {(pre.data || []).map((b) => (
            <article className="machine-card" key={b.id}>
              <div className="machine-visual">
                <span className="eyebrow">{b.prebuiltCategory}</span>
              </div>
              <h3>{b.name}</h3>
              <ul className="spec-list">
                <li>{spec(b, "cpu")}</li>
                <li>{spec(b, "gpu")}</li>
                <li>{spec(b, "ram")}</li>
                <li>{spec(b, "storage")}</li>
              </ul>
              <p className="price">₹{Number(b.pricing?.total || 0).toLocaleString("en-IN")}</p>
              <div className="cta-row">
                <button className="btn" onClick={() => { load(b); nav("/builder"); }}>View in 3D</button>
                <button className="btn-primary" onClick={() => { load(b); nav("/builder"); }}>Configure</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq">
        <h2>Questions</h2>
        {FAQS.map(([q, a], i) => (
          <button key={q} className={`faq-item ${openFaq === i ? "open" : ""}`} onClick={() => setOpenFaq(i === openFaq ? -1 : i)}>
            <strong>{q}</strong>
            {openFaq === i && <p className="muted">{a}</p>}
          </button>
        ))}
      </section>
    </>
  );
}

export function About() {
  return (
    <div className="page prose">
      <Seo title="About" />
      <h1>Built like a studio, not a warehouse bin</h1>
      <p>Kaelon is an original custom-PC atelier. We design the buying experience around a real machine you can rotate, explode, and inspect — then we assemble that exact configuration.</p>
      <p>No copied brands, no cloned storefronts. Parts in the catalogue use fictional names so the software can ship without proprietary assets.</p>
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="page">
      <Seo title="Support" />
      <h1>Support</h1>
      {FAQS.map(([q, a]) => (
        <article className="panel" key={q}><h3>{q}</h3><p className="muted">{a}</p></article>
      ))}
      <Link className="btn-primary" to="/contact">Contact us</Link>
    </div>
  );
}

export function Gallery() {
  return (
    <div className="page">
      <Seo title="Gallery" />
      <h1>Gallery</h1>
      <p className="muted">Open the builder for live glass-side shots. Pre-builts below are the same rigs, frozen as configurations.</p>
      <div className="hero-3d gallery-stage">
        <PCViewer />
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="page">
      <Seo title="Contact" />
      <h1>Contact</h1>
      <p className="muted">Delhi NCR bench · hello@kaelon.local · +91 90000 00000</p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Name" required />
        <input type="email" placeholder="Email" required />
        <textarea placeholder="What are you building?" rows={5} />
        <button className="btn-primary">Send</button>
      </form>
    </div>
  );
}
