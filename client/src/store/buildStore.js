import { create } from "zustand";
import { api } from "../services/api.js";

const empty = {
  cpu: null,
  motherboard: null,
  gpu: null,
  ram: null,
  storage: null,
  cooler: null,
  cabinet: null,
  psu: null,
  fans: null,
  os: null,
  accessories: null,
};

export const useBuildStore = create((set, get) => ({
  configurationId: null,
  shareId: null,
  name: "Untitled build",
  components: { ...empty },
  rgb: { enabled: true, mode: "static", color: "#00eaff", speed: 1, brightness: 0.8 },
  pricing: null,
  power: null,
  compatibility: { compatible: true, complete: false, errors: [], warnings: [], missing: [] },
  selectedSlot: null,
  hoveredSlot: null,
  exploded: false,
  xray: false,
  cameraPreset: "default",
  showcase: false,
  loadingValidate: false,

  setSlot(slot) {
    set({ selectedSlot: slot, cameraPreset: slot || "default" });
  },
  setHovered(slot) {
    set({ hoveredSlot: slot });
  },
  setRgb(patch) {
    set({ rgb: { ...get().rgb, ...patch } });
  },
  toggleExploded() {
    set({ exploded: !get().exploded });
  },
  toggleXray() {
    set({ xray: !get().xray });
  },
  setCamera(preset) {
    set({ cameraPreset: preset, showcase: preset === "showcase" });
  },

  selectionPayload() {
    const c = get().components;
    const payload = {};
    for (const [k, v] of Object.entries(c)) {
      if (v?.id) payload[k] = v.id;
    }
    return payload;
  },

  async selectComponent(slot, component) {
    set({
      components: { ...get().components, [slot]: component },
      selectedSlot: slot,
      cameraPreset: slot,
    });
    await get().validate();
  },

  async loadFromConfig(cfg) {
    const next = { ...empty };
    for (const p of cfg.parts || []) next[p.slot] = p.component;
    set({
      configurationId: cfg.id,
      shareId: cfg.shareId,
      name: cfg.name,
      components: next,
      rgb: cfg.rgb || get().rgb,
      pricing: cfg.pricing,
      power: cfg.power || cfg.compatibility?.power,
      compatibility: cfg.compatibility || get().compatibility,
    });
  },

  async validate() {
    set({ loadingValidate: true });
    try {
      const { data } = await api.post("/configurations/validate", {
        components: get().selectionPayload(),
      });
      set({
        compatibility: data.data,
        pricing: data.data.pricing,
        power: data.data.power,
        loadingValidate: false,
      });
      return data.data;
    } catch {
      set({ loadingValidate: false });
      return null;
    }
  },
}));
