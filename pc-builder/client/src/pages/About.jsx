import Seo from '../components/Seo';

export default function About() {
  return (
    <div className="wrap" style={{ padding: '48px 0' }}>
      <Seo title="About" path="/about" description="AetherForge is an independent custom PC studio for the Indian market." />
      <p className="badge">Studio</p>
      <h1>We forge machines, not mystery boxes.</h1>
      <p className="muted" style={{ maxWidth: 680 }}>
        AetherForge is a fictional-but-fully-wired commerce platform: every listed system is assembled from a
        normalized parts catalogue with socket, RAM, clearance, and PSU rules enforced on the server.
      </p>
      <div className="grid product-grid" style={{ marginTop: 32 }}>
        {[
          ['Original catalogue', 'No cloned product lines. Fictional SKUs, real compatibility math.'],
          ['GST-first pricing', 'Sticky totals always show parts + GST + delivery.'],
          ['India logistics', 'Designed around pan-India delivery and onsite windows.'],
          ['Human support', 'Tickets with attachments live on the same account as your orders.'],
        ].map(([t, c]) => (
          <article className="card" key={t}>
            <h3>{t}</h3>
            <p className="muted">{c}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
