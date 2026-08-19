import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LeadForm from './LeadForm';

const links = [
  ['/', 'Home'],
  ['/prebuild', 'Pre-builds'],
  ['/configure', 'Configure'],
  ['/gallery', 'Gallery'],
  ['/about', 'About'],
  ['/faq', 'FAQ'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" to="/">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 10 L50 22 V42 L32 54 L14 42 V22 Z" stroke="#7c5cff" strokeWidth="3" fill="none" />
              <path d="M32 22 L42 28 V40 L32 46 L22 40 V28 Z" fill="#3ee0c5" />
            </svg>
            AETHERFORGE
          </Link>
          <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
            <NavLink to="/cart">Cart</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard">Account</NavLink>
                {user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/sign-in">Sign in</NavLink>
            )}
          </nav>
          <button className="hamburger" type="button" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="wrap grid two">
          <div>
            <h3>AetherForge</h3>
            <p>Precision-built desktops for India. GST invoiced. Free standard delivery on complete systems.</p>
            <p>
              <Link to="/contact-us">Contact</Link> · <Link to="/refund-policy">Refunds</Link> ·{' '}
              <Link to="/privacy-policy">Privacy</Link> · <Link to="/terms-of-service">Terms</Link>
            </p>
          </div>
          <LeadForm />
        </div>
      </footer>
    </>
  );
}
