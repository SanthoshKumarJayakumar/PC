import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Footer } from "./Footer.jsx";

export function Layout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const hideFooter = loc.pathname.startsWith("/builder") || loc.pathname.startsWith("/admin");
  return (
    <>
      <header className="app-header">
        <Link className="brand" to="/">KAELON</Link>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/builder">Configure PC</NavLink>
          <NavLink to="/prebuilt">Pre-Builds</NavLink>
          <NavLink to="/components">Components</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/faq">Support</NavLink>
        </nav>
        <div className="header-actions">
          <Link className="btn-ghost" to="/cart">Cart</Link>
          {user ? (
            <Link className="btn" to={user.role === "ADMIN" ? "/admin" : "/dashboard"}>{user.firstName}</Link>
          ) : (
            <Link className="btn-primary" to="/login">Sign in</Link>
          )}
          <button className="drawer" aria-label="Menu" onClick={() => setOpen((v) => !v)}>Menu</button>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" onClick={() => setOpen(false)}>
          <Link to="/builder">Configure PC</Link>
          <Link to="/prebuilt">Pre-Builds</Link>
          <Link to="/components">Components</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">Support</Link>
          <Link to="/dashboard">Account</Link>
        </nav>
      )}
      <Outlet />
      {!hideFooter && <Footer />}
    </>
  );
}
