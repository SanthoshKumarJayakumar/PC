import { computePower, recommendPsuWattage } from "../lib/pricing.js";

function meta(part) {
  return part?.component?.compatibilityMetadata || {};
}

function err(code, component, message, extra = {}) {
  return { code, component, message, ...extra };
}

export function validateBuild(parts, psuWattages = [550, 650, 750, 850, 1000, 1200]) {
  const by = Object.fromEntries(parts.filter((p) => p.component).map((p) => [p.slot, p]));
  const errors = [];
  const warnings = [];

  const cpu = by.cpu;
  const mb = by.motherboard;
  const ram = by.ram;
  const gpu = by.gpu;
  const storage = parts.filter((p) => p.slot === "storage" && p.component);
  const cooler = by.cooler;
  const cabinet = by.cabinet;
  const psu = by.psu;

  if (cpu && mb && meta(cpu).socket !== meta(mb).socket) {
    errors.push(
      err("SOCKET_MISMATCH", "cpu", `CPU socket ${meta(cpu).socket} does not match motherboard socket ${meta(mb).socket}.`, {
        required: meta(mb).socket,
        current: meta(cpu).socket,
      }),
    );
  }

  if (ram && mb && meta(ram).ramGen !== meta(mb).ramGen) {
    errors.push(
      err("RAM_GENERATION", "ram", `This motherboard does not support ${meta(ram).ramGen} RAM.`, {
        required: meta(mb).ramGen,
        current: meta(ram).ramGen,
      }),
    );
  }

  if (ram && mb) {
    const slots = Number(meta(mb).ramSlots || 4);
    const sticks = Number(meta(ram).sticks || 1);
    const cap = Number(meta(ram).capacityGb || 0);
    if (sticks > slots) {
      errors.push(err("RAM_SLOTS", "ram", `Kit uses ${sticks} sticks but the board has ${slots} DIMM slots.`));
    }
    if (cap > Number(meta(mb).maxRamGb || 9999)) {
      errors.push(err("RAM_CAPACITY", "ram", `Capacity ${cap}GB exceeds board maximum ${meta(mb).maxRamGb}GB.`));
    }
  }

  if (mb && cabinet) {
    const ff = meta(mb).formFactor;
    const supported = meta(cabinet).formFactors || [];
    if (ff && supported.length && !supported.includes(ff)) {
      errors.push(err("MB_CASE_FF", "cabinet", `${ff} motherboard is not supported by this cabinet.`));
    }
  }

  if (gpu && cabinet) {
    const len = Number(meta(gpu).lengthMm || 0);
    const max = Number(meta(cabinet).gpuClearanceMm || 0);
    if (len && max && len > max) {
      errors.push(
        err("GPU_LENGTH", "gpu", `GPU length ${len}mm exceeds cabinet clearance ${max}mm.`, {
          required: max,
          current: len,
        }),
      );
    }
  }

  const power = computePower(parts);
  const recommended = recommendPsuWattage(power.estimatedLoad, psuWattages);
  if (psu) {
    const watts = Number(meta(psu).wattage || 0);
    const gpuMin = gpu ? Number(meta(gpu).minPsuW || 0) : 0;
    if (gpuMin && watts && watts < gpuMin) {
      errors.push(
        err("PSU_INSUFFICIENT", "psu", `Selected GPU requires a minimum ${gpuMin}W PSU.`, {
          required: gpuMin,
          current: watts,
        }),
      );
    }
    const needed = Math.ceil(power.estimatedLoad * power.headroomFactor);
    if (watts && watts < needed) {
      errors.push(
        err("PSU_HEADROOM", "psu", `Estimated load ${power.estimatedLoad}W needs about ${needed}W with headroom. Current PSU is ${watts}W.`, {
          required: needed,
          current: watts,
        }),
      );
    }
  }

  if (cpu && cooler) {
    const sockets = meta(cooler).sockets || [];
    if (sockets.length && !sockets.includes(meta(cpu).socket)) {
      errors.push(err("COOLER_SOCKET", "cooler", `Cooler does not support CPU socket ${meta(cpu).socket}.`));
    }
  }

  if (cooler && cabinet && meta(cooler).type === "air") {
    const h = Number(meta(cooler).heightMm || 0);
    const max = Number(meta(cabinet).coolerClearanceMm || 0);
    if (h && max && h > max) {
      errors.push(err("COOLER_HEIGHT", "cooler", `Cooler height ${h}mm exceeds cabinet clearance ${max}mm.`));
    }
  }

  if (cooler && cabinet && meta(cooler).type === "aio") {
    const rad = Number(meta(cooler).radiatorMm || 0);
    const supported = meta(cabinet).radiators || [];
    if (rad && supported.length && !supported.includes(rad)) {
      errors.push(err("RADIATOR", "cooler", `Cabinet does not support a ${rad}mm radiator.`));
    }
  }

  if (mb && storage.length) {
    const m2 = Number(meta(mb).m2Slots || 0);
    const sata = Number(meta(mb).sataPorts || 0);
    const m2Used = storage.filter((s) => meta(s).form === "M.2" || meta(s).interface === "NVMe").length;
    const sataUsed = storage.filter((s) => meta(s).interface === "SATA").length;
    if (m2Used > m2) errors.push(err("M2_SLOTS", "storage", `Board has ${m2} M.2 slots; ${m2Used} NVMe drives selected.`));
    if (sataUsed > sata) errors.push(err("SATA_PORTS", "storage", `Board has ${sata} SATA ports; ${sataUsed} SATA drives selected.`));
  }

  const required = ["cpu", "motherboard", "ram", "gpu", "storage", "cooler", "cabinet", "psu"];
  const missing = required.filter((s) => !by[s] && (s !== "storage" || !storage.length));
  if (storage.length) {
    const i = missing.indexOf("storage");
    if (i >= 0) missing.splice(i, 1);
  }

  return {
    compatible: errors.length === 0,
    complete: missing.length === 0 && errors.length === 0,
    missing,
    errors,
    warnings,
    power: { ...power, recommendedPsu: recommended },
  };
}

export function partsFromMap(componentBySlot) {
  return Object.entries(componentBySlot || {})
    .filter(([, c]) => c)
    .flatMap(([slot, c]) =>
      Array.isArray(c) ? c.map((item, i) => ({ slot, sortOrder: i, component: item })) : [{ slot, sortOrder: 0, component: c }],
    );
}
