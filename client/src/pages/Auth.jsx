import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Seo } from "../components/Seo.jsx";

export function Login() {
  const { refresh, setUser } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post("/auth/login", { email: fd.get("email"), password: fd.get("password") });
      setUser(data.data.user);
      await refresh();
      nav("/dashboard");
    } catch (ex) {
      setErr(ex.response?.data?.error?.message || "Login failed");
    }
  }
  return (
    <div className="page">
      <Seo title="Sign in" />
      <h1>Sign in</h1>
      {err && <div className="alert error">{err}</div>}
      <form className="form" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button className="btn-primary" type="submit">Sign in</button>
      </form>
      <p className="muted"><Link to="/register">Create account</Link></p>
    </div>
  );
}

export function Register() {
  const { setUser, refresh } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post("/auth/register", {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        mobile: fd.get("mobile"),
        password: fd.get("password"),
        confirmPassword: fd.get("confirmPassword"),
      });
      setUser(data.data.user);
      await refresh();
      nav("/builder");
    } catch (ex) {
      setErr(ex.response?.data?.error?.message || "Could not register");
    }
  }
  return (
    <div className="page">
      <Seo title="Register" />
      <h1>Create account</h1>
      {err && <div className="alert error">{err}</div>}
      <form className="form" onSubmit={onSubmit}>
        <input name="firstName" placeholder="First name" required />
        <input name="lastName" placeholder="Last name" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="mobile" placeholder="Mobile" />
        <input name="password" type="password" placeholder="Password (8+)" required />
        <input name="confirmPassword" type="password" placeholder="Confirm password" required />
        <button className="btn-primary" type="submit">Register</button>
      </form>
    </div>
  );
}
