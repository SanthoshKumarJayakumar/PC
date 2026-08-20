import { Link } from "react-router-dom";
import { Reveal } from "../motion/Motion.jsx";

export function Footer() {
  return (
    <Reveal>
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="brand">KAELON</p>
          <p className="muted">Custom machines, assembled in India. See the build in 3D before it ships.</p>
        </div>
        <div>
          <h4>Products</h4>
          <Link to="/builder">Configure PC</Link>
          <Link to="/prebuilt">Pre-built PCs</Link>
          <Link to="/components">Components</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/dashboard/support">Tickets</Link>
          <p className="muted">hello@kaelon.local</p>
        </div>
      </div>
      <p className="muted footer-copy">© {new Date().getFullYear()} Kaelon Systems. Original brand — not affiliated with any other PC retailer.</p>
    </footer>
    </Reveal>
  );
}
