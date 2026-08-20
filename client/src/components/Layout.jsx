import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Footer } from "./Footer.jsx";
import { ClickSpark, Magnet, PageFade } from "../motion/Motion.jsx";

export function Layout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const hideFooter = loc.pathname.startsWith("/builder") || loc.pathname.startsWith("/admin");
  const accountTo = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  return (
    <>
      <motion.header
        className="app-header"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
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
          <Link className="btn-ghost header-cart" to="/cart">Cart</Link>
          {user ? (
            <Magnet>
              <Link className="btn header-account" to={accountTo}>{user.firstName}</Link>
            </Magnet>
          ) : (
            <Magnet>
              <Link className="btn-primary header-account" to="/login">Sign in</Link>
            </Magnet>
          )}
          <button
            className="drawer"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X strokeWidth={1.75} /> : <Menu strokeWidth={1.75} />}
          </button>
        </div>
      </motion.header>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/builder">Configure PC</NavLink>
          <NavLink to="/prebuilt">Pre-Builds</NavLink>
          <NavLink to="/components">Components</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/faq">Support</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {user ? (
            <NavLink to={accountTo}>{user.role === "ADMIN" ? "Admin" : "Account"}</NavLink>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      )}
      <ClickSpark />
      <PageFade>
        <Outlet />
        {!hideFooter && <Footer />}
      </PageFade>
    </>
  );
}
