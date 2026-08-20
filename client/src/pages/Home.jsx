import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { api } from "../services/api.js";
import { useBuildStore } from "../store/buildStore.js";
import { Seo } from "../components/Seo.jsx";
import { PCViewer } from "../three/PCViewer/PCViewer.jsx";
import { GlareCard, Magnet, Reveal, SplitTitle, StarBorder, Stagger } from "../motion/Motion.jsx";

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
  const statsRef = useRef(null);

  useLayoutEffect(() => {
    if (!statsRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-stats div", { y: 18, opacity: 0, stagger: 0.1, duration: 0.55, delay: 0.55, ease: "power3.out" });
    }, statsRef);
    return () => ctx.revert();
  }, []);

  function spec(build, slot) {
    return build.parts?.find((p) => p.slot === slot)?.component?.name || "—";
  }

  return (
    <>
      <Seo title="Custom PCs in 3D" description="Configure every component. See it in 3D. Build without compromises." />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">KAELON · INDIA</p>
          <SplitTitle text="BUILD YOUR PERFECT MACHINE" />
          <Reveal delay={0.28}>
            <p>Configure every component. See it in 3D. Build without compromises.</p>
            <div className="cta-row">
              <Magnet>
                <StarBorder>
                  <Link className="btn-primary" to="/builder">START BUILDING</Link>
                </StarBorder>
              </Magnet>
              <Magnet strength={0.2}>
                <Link className="btn" to="/prebuilt">EXPLORE PRE-BUILTS</Link>
              </Magnet>
            </div>
          </Reveal>
          <dl className="hero-stats" ref={statsRef}>
            <div><dt>Live 3D</dt><dd>Glass-side inspection</dd></div>
            <div><dt>GST inclusive</dt><dd>Server-side pricing</dd></div>
            <div><dt>Compatibility</dt><dd>Socket · RAM · PSU</dd></div>
          </dl>
        </div>
        <motion.div
          className="hero-3d"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <PCViewer autoRotate />
          <p className="viewer-caption muted">Drag to orbit · scroll to zoom</p>
        </motion.div>
      </section>

      <section className="section">
        <Reveal><h2>How a Kaelon build is made</h2></Reveal>
        <Stagger className="process">
          {PROCESS.map(([n, t, d]) => (
            <GlareCard key={n}>
              <article className="process-card">
                <span className="eyebrow">{n}</span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </article>
            </GlareCard>
          ))}
        </Stagger>
      </section>

      <section className="section">
        <Reveal>
          <div className="row">
            <h2>Featured machines</h2>
            <Link to="/prebuilt">View all</Link>
          </div>
        </Reveal>
        <Stagger className="product-grid" delay={0.1}>
          {(pre.data || []).map((b) => (
            <GlareCard key={b.id}>
              <article className="machine-card">
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
            </GlareCard>
          ))}
        </Stagger>
      </section>

      <section className="section faq">
        <Reveal><h2>Questions</h2></Reveal>
        {FAQS.map(([q, a], i) => (
          <button key={q} className={`faq-item ${openFaq === i ? "open" : ""}`} onClick={() => setOpenFaq(i === openFaq ? -1 : i)}>
            <strong>{q}</strong>
            <AnimatePresence initial={false}>
              {openFaq === i && (
                <motion.p
                  className="muted"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  {a}
                </motion.p>
              )}
            </AnimatePresence>
          </button>
        ))}
      </section>
    </>
  );
}

export function About() {
  return (
    <Reveal className="page prose">
      <Seo title="About" />
      <h1>Built like a studio, not a warehouse bin</h1>
      <p>Kaelon is an original custom-PC atelier. We design the buying experience around a real machine you can rotate, explode, and inspect — then we assemble that exact configuration.</p>
      <p>No copied brands, no cloned storefronts. Parts in the catalogue use fictional names so the software can ship without proprietary assets.</p>
    </Reveal>
  );
}

export function FaqPage() {
  return (
    <div className="page">
      <Seo title="Support" />
      <Reveal><h1>Support</h1></Reveal>
      <Stagger delay={0.06}>
        {FAQS.map(([q, a]) => (
          <article className="panel" key={q}><h3>{q}</h3><p className="muted">{a}</p></article>
        ))}
      </Stagger>
      <Reveal delay={0.15}><Link className="btn-primary" to="/contact">Contact us</Link></Reveal>
    </div>
  );
}

export function Gallery() {
  return (
    <div className="page">
      <Seo title="Gallery" />
      <Reveal>
        <h1>Gallery</h1>
        <p className="muted">Open the builder for live glass-side shots. Pre-builts below are the same rigs, frozen as configurations.</p>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="gallery-stage">
          <PCViewer />
        </div>
      </Reveal>
    </div>
  );
}

export function Contact() {
  return (
    <Reveal className="page">
      <Seo title="Contact" />
      <h1>Contact</h1>
      <p className="muted">Delhi NCR bench · hello@kaelon.local · +91 90000 00000</p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Name" required />
        <input type="email" placeholder="Email" required />
        <textarea placeholder="What are you building?" rows={5} />
        <button className="btn-primary">Send</button>
      </form>
    </Reveal>
  );
}
