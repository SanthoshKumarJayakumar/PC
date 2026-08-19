import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, Route, Routes } from "react-router-dom";
import { api } from "../services/api.js";
import { Seo } from "../components/Seo.jsx";
import { useState } from "react";

function Stats() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get("/admin/stats")).data.data });
  return (
    <div className="grid" style={{ padding: 0 }}>
      {Object.entries(q.data || {}).map(([k, v]) => (
        <article className="panel" key={k}><p className="muted">{k}</p><h2>{v}</h2></article>
      ))}
    </div>
  );
}

function ComponentsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-c"], queryFn: async () => (await api.get("/admin/components")).data.data.items });
  return (
    <div>
      {(q.data || []).map((c) => (
        <article className="panel row" key={c.id}>
          <span>{c.name}</span>
          <span>₹{Number(c.price).toLocaleString("en-IN")}</span>
          <button className="btn" onClick={async () => {
            await api.put(`/admin/components/${c.id}`, { active: !c.active, name: c.name, price: Number(c.price) });
            qc.invalidateQueries({ queryKey: ["admin-c"] });
          }}>{c.active ? "Deactivate" : "Activate"}</button>
        </article>
      ))}
    </div>
  );
}

function ModelsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-m"], queryFn: async () => (await api.get("/admin/models")).data.data.items });
  const [id, setId] = useState(null);
  const selected = (q.data || []).find((m) => m.id === id);
  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.put(`/admin/models/${id}`, {
      positionX: Number(fd.get("positionX")),
      positionY: Number(fd.get("positionY")),
      positionZ: Number(fd.get("positionZ")),
      rotationX: Number(fd.get("rotationX")),
      rotationY: Number(fd.get("rotationY")),
      rotationZ: Number(fd.get("rotationZ")),
      scaleX: Number(fd.get("scaleX")),
      scaleY: Number(fd.get("scaleY")),
      scaleZ: Number(fd.get("scaleZ")),
      modelUrl: fd.get("modelUrl") || null,
      assembledTransform: {
        x: Number(fd.get("positionX")),
        y: Number(fd.get("positionY")),
        z: Number(fd.get("positionZ")),
      },
      explodedTransform: {
        x: Number(fd.get("positionX")) + 0.12,
        y: Number(fd.get("positionY")) + 0.08,
        z: Number(fd.get("positionZ")),
      },
    });
    qc.invalidateQueries({ queryKey: ["admin-m"] });
  }
  return (
    <div>
      <select onChange={(e) => setId(e.target.value)} value={id || ""}>
        <option value="">Select model</option>
        {(q.data || []).map((m) => (
          <option key={m.id} value={m.id}>{m.component.name}</option>
        ))}
      </select>
      {selected && (
        <form className="form" onSubmit={save} style={{ marginTop: 12 }}>
          <input name="modelUrl" placeholder="GLB URL (optional)" defaultValue={selected.modelUrl || ""} />
          {["positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "scaleX", "scaleY", "scaleZ"].map((f) => (
            <label key={f}>{f}<input name={f} type="number" step="0.01" defaultValue={selected[f]} /></label>
          ))}
          <button className="btn-primary">Save transform</button>
        </form>
      )}
    </div>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-o"], queryFn: async () => (await api.get("/admin/orders")).data.data.items });
  return (
    <div>
      {(q.data || []).map((o) => (
        <article className="panel" key={o.id}>
          <div className="row"><strong>{o.orderNumber}</strong><span>{o.status}</span></div>
          <select defaultValue={o.status} onChange={async (e) => {
            await api.put(`/admin/orders/${o.id}/status`, { status: e.target.value });
            qc.invalidateQueries({ queryKey: ["admin-o"] });
          }}>
            {["ORDER_RECEIVED","CONFIGURATION_REVIEW","ASSEMBLY","TESTING","QUALITY_CHECK","PACKAGING","SHIPPED","DELIVERED","CANCELLED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </article>
      ))}
    </div>
  );
}

function SimpleList({ path, label }) {
  const q = useQuery({ queryKey: [path], queryFn: async () => (await api.get(path)).data.data.items || (await api.get(path)).data.data });
  return (
    <div>
      <h3>{label}</h3>
      <pre className="muted" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(q.data, null, 2)}</pre>
    </div>
  );
}

export function Admin() {
  return (
    <div className="page">
      <Seo title="Admin" />
      <h1>Admin</h1>
      <nav className="filters">
        {[
          ["", "Dashboard"],
          ["components", "Components"],
          ["models", "3D Models"],
          ["compatibility", "Compatibility"],
          ["inventory", "Inventory"],
          ["orders", "Orders"],
          ["users", "Users"],
          ["coupons", "Coupons"],
          ["analytics", "Analytics"],
        ].map(([p, l]) => (
          <NavLink key={p} className="btn" to={`/admin${p ? "/" + p : ""}`}>{l}</NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Stats />} />
        <Route path="components" element={<ComponentsAdmin />} />
        <Route path="models" element={<ModelsAdmin />} />
        <Route path="compatibility" element={<SimpleList path="/admin/compatibility" label="Rules" />} />
        <Route path="inventory" element={<SimpleList path="/admin/inventory" label="Inventory" />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="users" element={<SimpleList path="/admin/users" label="Users" />} />
        <Route path="coupons" element={<SimpleList path="/admin/coupons" label="Coupons" />} />
        <Route path="analytics" element={<SimpleList path="/admin/analytics" label="Analytics" />} />
      </Routes>
    </div>
  );
}
