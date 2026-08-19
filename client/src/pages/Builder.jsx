import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useBuildStore } from "../store/buildStore.js";
import { PCViewer } from "../three/PCViewer/PCViewer.jsx";
import { Seo } from "../components/Seo.jsx";

const SLOTS = ["cpu", "motherboard", "ram", "gpu", "storage", "cooler", "cabinet", "psu", "fans"];

export function Builder() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const selectedSlot = useBuildStore((s) => s.selectedSlot) || "cpu";
  const setSlot = useBuildStore((s) => s.setSlot);
  const selectComponent = useBuildStore((s) => s.selectComponent);
  const components = useBuildStore((s) => s.components);
  const compatibility = useBuildStore((s) => s.compatibility);
  const pricing = useBuildStore((s) => s.pricing);
  const power = useBuildStore((s) => s.power);
  const rgb = useBuildStore((s) => s.rgb);
  const setRgb = useBuildStore((s) => s.setRgb);
  const cameraPreset = useBuildStore((s) => s.cameraPreset);
  const setCamera = useBuildStore((s) => s.setCamera);
  const toggleExploded = useBuildStore((s) => s.toggleExploded);
  const toggleXray = useBuildStore((s) => s.toggleXray);
  const exploded = useBuildStore((s) => s.exploded);
  const xray = useBuildStore((s) => s.xray);
  const loadFromConfig = useBuildStore((s) => s.loadFromConfig);
  const validate = useBuildStore((s) => s.validate);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const id = params.get("config");
    const share = params.get("share");
    if (id) api.get(`/configurations/${id}`).then((r) => loadFromConfig(r.data.data));
    else if (share) api.get(`/configurations/share/${share}`).then((r) => loadFromConfig(r.data.data));
  }, [params, loadFromConfig]);

  const list = useQuery({
    queryKey: ["parts", selectedSlot, q],
    queryFn: async () => (await api.get("/components", { params: { category: selectedSlot, q, pageSize: 40 } })).data.data,
  });

  const errorFor = (slot) => compatibility.errors?.filter((e) => e.component === slot) || [];

  async function save() {
    if (!user) return navigate("/login");
    const payload = { name: useBuildStore.getState().name, components: useBuildStore.getState().selectionPayload(), rgb, isPublic: true };
    const id = useBuildStore.getState().configurationId;
    const r = id ? await api.put(`/configurations/${id}`, payload) : await api.post("/configurations", payload);
    useBuildStore.setState({ configurationId: r.data.data.id, shareId: r.data.data.shareId, name: r.data.data.name });
    setToast("Build saved.");
  }

  async function addCart() {
    if (!user) return navigate("/login");
    await save();
    const id = useBuildStore.getState().configurationId;
    await api.post("/cart/items", { configurationId: id });
    navigate("/cart");
  }

  const completion = useMemo(() => {
    const required = ["cpu", "motherboard", "ram", "gpu", "storage", "cooler", "cabinet", "psu"];
    const done = required.filter((s) => components[s]);
    return { done: done.length, total: required.length };
  }, [components]);

  return (
    <>
      <Seo title="3D Builder" />
      <div className="builder">
        <aside className="pane">
          <div className="row">
            <strong>Components</strong>
            <span className="muted">{completion.done}/{completion.total}</span>
          </div>
          <div className="filters">
            {SLOTS.map((s) => (
              <button key={s} className={s === selectedSlot ? "btn-primary" : "btn"} onClick={() => setSlot(s)}>
                {s} {components[s] ? "✓" : ""}
              </button>
            ))}
          </div>
          <input className="search" placeholder={`Search ${selectedSlot}`} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="card-list">
            {(list.data?.items || []).map((c) => {
              const selected = components[selectedSlot]?.id === c.id;
              const issues = errorFor(selectedSlot);
              return (
                <article key={c.id} className={`comp-card ${selected ? "ok" : ""} ${issues.length && selected ? "bad" : ""}`} onClick={() => selectComponent(selectedSlot, c)}>
                  <div className="row">
                    <strong>{c.name}</strong>
                    <span className="price">₹{Number(c.price).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="muted">{c.brand} · {c.available > 0 ? "In stock" : "Out of stock"}</p>
                  <p className="muted">{c.description}</p>
                  <button className="btn-primary" type="button">SELECT</button>
                </article>
              );
            })}
          </div>
        </aside>
        <div style={{ position: "relative" }}>
          <PCViewer />
          <div className="toolbar">
            {["default", "front", "back", "left", "right", "top"].map((p) => (
              <button key={p} className={cameraPreset === p ? "is-on" : ""} onClick={() => setCamera(p)}>{p}</button>
            ))}
            <button className={cameraPreset === "showcase" ? "is-on" : ""} onClick={() => setCamera("showcase")}>360°</button>
            <button className={exploded ? "is-on" : ""} onClick={toggleExploded}>{exploded ? "Assemble" : "Exploded"}</button>
            <button className={xray ? "is-on" : ""} onClick={toggleXray}>{xray ? "Solid" : "X-Ray"}</button>
          </div>
        </div>
        <aside className="pane right">
          <h2>Your Build</h2>
          {SLOTS.map((s) => (
            <div className="row" key={s}>
              <span className="muted">{s}</span>
              <span>{components[s]?.name || "—"}</span>
            </div>
          ))}
          <hr style={{ borderColor: "var(--line)" }} />
          <div className="row"><span>Subtotal</span><span>₹{Number(pricing?.subtotal || 0).toLocaleString("en-IN")}</span></div>
          <div className="row"><span>GST</span><span>₹{Number(pricing?.gst || 0).toLocaleString("en-IN")}</span></div>
          <div className="row"><span>Delivery</span><span>₹{Number(pricing?.delivery || 0).toLocaleString("en-IN")}</span></div>
          <div className="row"><strong>Total</strong><strong className="price">₹{Number(pricing?.total || 0).toLocaleString("en-IN")}</strong></div>
          <p className="muted">Estimated load {power?.estimatedLoad || 0}W · Recommended PSU {power?.recommendedPsu || "—"}W</p>
          {compatibility.errors?.map((e) => (
            <div key={e.code + e.message} className="alert error">
              <strong>Compatibility issue</strong>
              <p>{e.message}</p>
              {e.component && (
                <button className="btn" onClick={() => setSlot(e.component)}>SHOW COMPATIBLE {e.component.toUpperCase()}S</button>
              )}
            </div>
          ))}
          <label className="muted">RGB lighting</label>
          <div className="row">
            <input type="color" value={rgb.color} aria-label="RGB color" onChange={(e) => setRgb({ color: e.target.value, enabled: true })} />
            <select value={rgb.mode} onChange={(e) => setRgb({ mode: e.target.value })}>
              <option value="static">Static</option>
              <option value="rainbow">Rainbow</option>
              <option value="breathing">Breathing</option>
              <option value="wave">Wave</option>
              <option value="off">Off</option>
            </select>
          </div>
          <div className="cta-row">
            <button className="btn" onClick={save}>SAVE BUILD</button>
            <button className="btn-primary" onClick={addCart} disabled={!compatibility.complete}>ADD TO CART</button>
          </div>
          <button className="btn-ghost" onClick={validate}>Re-validate</button>
        </aside>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
