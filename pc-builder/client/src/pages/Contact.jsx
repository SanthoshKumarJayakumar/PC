import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';

export default function Contact() {
  return (
    <div className="wrap grid two" style={{ padding: '48px 0' }}>
      <Seo title="Contact" path="/contact-us" />
      <div>
        <h1>Contact us</h1>
        <p>Studio hours 9:00–18:30 IST, seven days.</p>
        <p>Email: hello@aetherforge.example</p>
        <p>Phone: +91 90000 11111 (demo)</p>
        <p>AetherForge Labs, Bengaluru, Karnataka — fictional address for this demo platform.</p>
      </div>
      <LeadForm />
    </div>
  );
}
