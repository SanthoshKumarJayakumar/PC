import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { Seo } from "../components/Seo.jsx";
import { useState } from "react";

export function CartPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["cart"], queryFn: async () => (await api.get("/cart")).data.data });
  if (!q.data) return <div className="page muted">Loading cart…</div>;
  if (!q.data.items?.length) return <div className="page"><Seo title="Cart" /><h1>Cart is empty</h1></div>;
  return (
    <div className="page">
      <Seo title="Cart" />
      <h1>Cart</h1>
      {q.data.items.map((it) => (
        <article className="panel" key={it.id}>
          <div className="row">
            <strong>{it.configuration?.name || it.component?.name}</strong>
            <button className="btn-ghost" onClick={async () => { await api.delete(`/cart/items/${it.id}`); qc.invalidateQueries({ queryKey: ["cart"] }); }}>Remove</button>
          </div>
          <p className="muted">Qty {it.quantity}</p>
        </article>
      ))}
      <div className="panel">
        <div className="row"><span>Subtotal</span><span>₹{Number(q.data.pricing?.subtotal || 0).toLocaleString("en-IN")}</span></div>
        <div className="row"><span>GST</span><span>₹{Number(q.data.pricing?.gst || 0).toLocaleString("en-IN")}</span></div>
        <div className="row"><span>Delivery</span><span>₹{Number(q.data.pricing?.delivery || 0).toLocaleString("en-IN")}</span></div>
        <div className="row"><strong>Total</strong><strong>₹{Number(q.data.pricing?.total || 0).toLocaleString("en-IN")}</strong></div>
      </div>
      <button className="btn-primary" onClick={() => nav("/checkout")}>Checkout</button>
    </div>
  );
}

export function CheckoutPage() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const cart = useQuery({ queryKey: ["cart"], queryFn: async () => (await api.get("/cart")).data.data });
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { data } = await api.post("/orders", {
        paymentMethod: fd.get("paymentMethod"),
        couponCode: fd.get("couponCode") || undefined,
        address: {
          line1: fd.get("line1"),
          city: fd.get("city"),
          state: fd.get("state"),
          pincode: fd.get("pincode"),
          phone: fd.get("phone"),
        },
      });
      nav(`/order/${data.data.id}`);
    } catch (ex) {
      setErr(ex.response?.data?.error?.message || "Checkout failed");
    }
  }
  return (
    <div className="page">
      <Seo title="Checkout" />
      <h1>Checkout</h1>
      {err && <div className="alert error">{err}</div>}
      <p className="muted">Total ₹{Number(cart.data?.pricing?.total || 0).toLocaleString("en-IN")}</p>
      <form className="form" onSubmit={onSubmit}>
        <input name="line1" placeholder="Address" required />
        <input name="city" placeholder="City" required />
        <input name="state" placeholder="State" required />
        <input name="pincode" placeholder="Pincode" required />
        <input name="phone" placeholder="Phone" required />
        <input name="couponCode" placeholder="Coupon (optional)" />
        <select name="paymentMethod" defaultValue="TEST">
          <option value="TEST">Test payment</option>
          <option value="COD">Cash on delivery</option>
        </select>
        <button className="btn-primary" type="submit">Place order</button>
      </form>
    </div>
  );
}
