import Seo from '../components/Seo';

const COPY = {
  refund: {
    title: 'Refund policy',
    path: '/refund-policy',
    body: [
      'AetherForge does not accept returns after a system has been delivered and the e-invoice issued, except for wrong-item or component-mismatch cases we caused.',
      'Refund requests on the booking amount must arrive within 24 hours of the first payment, with a written reason. Approved refunds settle in 7–14 business days.',
      'If a mismatch occurs, we will onsite-service where feasible or cover return shipping to the studio.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    path: '/privacy-policy',
    body: [
      'We collect account data (name, email, mobile), build specifications, order and payment metadata, and support attachments you upload.',
      'Cookies are limited to authentication (HTTP-only access/refresh) and a readable CSRF token. We do not sell personal data.',
      'You may request access, correction, or erasure by emailing privacy@aetherforge.example. This demo is not intended for users under 18.',
    ],
  },
  terms: {
    title: 'Terms of service',
    path: '/terms-of-service',
    body: [
      'By placing an order you agree that compatibility is enforced server-side and invalid configurations cannot check out.',
      'Catalogue names and prices are fictional demo data. Production deployments must replace seed inventory and secrets.',
      'These terms are governed by the laws of India. Disputes: Bengaluru courts (demo jurisdiction).',
    ],
  },
};

export default function Policy({ kind }) {
  const p = COPY[kind];
  return (
    <div className="wrap" style={{ padding: '48px 0', maxWidth: 760 }}>
      <Seo title={p.title} path={p.path} />
      <h1>{p.title}</h1>
      {p.body.map((para) => (
        <p key={para}>{para}</p>
      ))}
    </div>
  );
}
