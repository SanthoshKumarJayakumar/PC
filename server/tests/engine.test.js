import { describe, expect, it } from "vitest";
import { validateBuild } from "../src/compatibility/engine.js";
import { computePower, computePricing, recommendPsuWattage } from "../src/lib/pricing.js";

const part = (slot, meta, extra = {}) => ({
  slot,
  component: { name: slot, powerConsumption: extra.w || 0, price: extra.price || 0, compatibilityMetadata: meta },
});

describe("compatibility engine", () => {
  it("flags socket mismatch", () => {
    const r = validateBuild([
      part("cpu", { socket: "HX5" }),
      part("motherboard", { socket: "AG8", ramGen: "DDR5" }),
    ]);
    expect(r.compatible).toBe(false);
    expect(r.errors[0].code).toBe("SOCKET_MISMATCH");
  });

  it("flags DDR generation", () => {
    const r = validateBuild([
      part("motherboard", { socket: "HX5", ramGen: "DDR5" }),
      part("ram", { ramGen: "DDR4" }),
    ]);
    expect(r.errors.some((e) => e.code === "RAM_GENERATION")).toBe(true);
  });

  it("flags GPU longer than case", () => {
    const r = validateBuild([
      part("gpu", { lengthMm: 336, minPsuW: 750 }),
      part("cabinet", { gpuClearanceMm: 250, formFactors: ["Mini-ITX"] }),
    ]);
    expect(r.errors.some((e) => e.code === "GPU_LENGTH")).toBe(true);
  });

  it("flags insufficient PSU for GPU", () => {
    const r = validateBuild([
      part("gpu", { minPsuW: 750 }, { w: 320 }),
      part("psu", { wattage: 650 }),
    ]);
    expect(r.errors.some((e) => e.code === "PSU_INSUFFICIENT")).toBe(true);
  });
});

describe("power + pricing", () => {
  it("recommends next PSU with headroom", () => {
    const p = computePower([part("gpu", {}, { w: 320 }), part("cpu", {}, { w: 120 })]);
    expect(p.estimatedLoad).toBe(470);
    expect(recommendPsuWattage(p.estimatedLoad)).toBeGreaterThanOrEqual(550);
  });

  it("adds GST and delivery", () => {
    const t = computePricing([10000]);
    expect(t.gst).toBe(Math.round(10000 * 0.18));
    expect(t.total).toBe(t.subtotal + t.gst + t.delivery);
  });
});
