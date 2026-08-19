/**
 * Server-side compatibility engine — source of truth for configurator + checkout.
 *
 * Expected specs shape (JSON on Component.specs):
 * CPU: { socket, tdpWatts, ramType, maxRamSpeed }
 * MB:  { socket, chipset, formFactor, ramType, ramSlots, maxRamGb, maxRamSpeed, m2Slots, sataPorts, gpuSlot }
 * RAM: { ramType, speedMhz, capacityGb, sticks, voltage }
 * GPU: { lengthMm, tdpWatts, slotWidth, pcie }
 * STORAGE: { interface: 'NVME'|'SATA', form: 'M.2'|'2.5'|'3.5', pcieGen }
 * CABINET: { formFactors: [], gpuMaxLengthMm, coolerMaxHeightMm, radiatorMm: [], psuForm, driveBays25, driveBays35 }
 * PSU: { wattage, formFactor, rating }
 * COOLER: { kind: 'AIR'|'AIO', sockets: [], heightMm, radiatorMm, tdpWatts }
 */

export const CATEGORY_SLUGS = {
  cpu: 'cpu',
  motherboard: 'motherboard',
  ram: 'ram',
  gpu: 'gpu',
  storage: 'storage',
  cabinet: 'cabinet',
  psu: 'psu',
  cooling: 'cooling',
  os: 'os',
  network: 'network',
  accessory: 'accessory',
  warranty: 'warranty',
};

function spec(component) {
  return component?.specs && typeof component.specs === 'object' ? component.specs : {};
}

function push(errors, code, message, fields = []) {
  errors.push({ code, message, fields });
}

function byCategory(parts) {
  const map = {};
  for (const part of parts) {
    const slug = part.category?.slug || part.categorySlug;
    if (!map[slug]) map[slug] = [];
    map[slug].push(part);
  }
  return map;
}

export function estimateSystemWattage(parts) {
  let total = 50;
  for (const part of parts) {
    const s = spec(part);
    total += Number(part.wattageEst || s.tdpWatts || s.wattageEst || 0);
  }
  return total;
}

export function validateCompatibility(parts, { allowIntegratedGpu = true } = {}) {
  const errors = [];
  const warnings = [];
  const grouped = byCategory(parts);

  const cpu = grouped.cpu?.[0];
  const mb = grouped.motherboard?.[0];
  const rams = grouped.ram || [];
  const gpu = grouped.gpu?.[0];
  const storages = grouped.storage || [];
  const cabinet = grouped.cabinet?.[0];
  const psu = grouped.psu?.[0];
  const cooler = grouped.cooling?.[0];

  if (!cpu) push(errors, 'MISSING_CPU', 'Choose a processor to continue.', ['cpu']);
  if (!mb) push(errors, 'MISSING_MB', 'Choose a motherboard.', ['motherboard']);
  if (!rams.length) push(errors, 'MISSING_RAM', 'Add at least one memory kit.', ['ram']);
  if (!storages.length) push(errors, 'MISSING_STORAGE', 'Add boot storage (NVMe or SATA).', ['storage']);
  if (!cabinet) push(errors, 'MISSING_CASE', 'Choose a cabinet.', ['cabinet']);
  if (!psu) push(errors, 'MISSING_PSU', 'Choose a power supply.', ['psu']);
  if (!cooler) push(errors, 'MISSING_COOLER', 'Choose a CPU cooler.', ['cooling']);

  const cpuS = spec(cpu);
  const mbS = spec(mb);
  const caseS = spec(cabinet);
  const psuS = spec(psu);
  const coolerS = spec(cooler);
  const gpuS = spec(gpu);

  if (cpu && mb) {
    if (cpuS.socket && mbS.socket && cpuS.socket !== mbS.socket) {
      push(
        errors,
        'SOCKET_MISMATCH',
        `CPU socket ${cpuS.socket} is not compatible with motherboard socket ${mbS.socket}.`,
        ['cpu', 'motherboard']
      );
    }
    const chipsets = Array.isArray(cpuS.chipsets) ? cpuS.chipsets : [];
    if (chipsets.length && mbS.chipset && !chipsets.includes(mbS.chipset)) {
      push(
        errors,
        'CHIPSET_MISMATCH',
        `Motherboard chipset ${mbS.chipset} is not validated for this CPU family.`,
        ['cpu', 'motherboard']
      );
    }
  }

  if (mb && rams.length) {
    let totalGb = 0;
    let sticks = 0;
    for (const ram of rams) {
      const rs = spec(ram);
      totalGb += Number(rs.capacityGb || 0) * Number(ram.quantity || 1);
      sticks += Number(rs.sticks || 1) * Number(ram.quantity || 1);
      if (mbS.ramType && rs.ramType && mbS.ramType !== rs.ramType) {
        push(
          errors,
          'RAM_TYPE',
          `This motherboard takes ${mbS.ramType}; selected kit is ${rs.ramType}.`,
          ['ram', 'motherboard']
        );
      }
      if (cpuS.ramType && rs.ramType && cpuS.ramType !== rs.ramType) {
        push(
          errors,
          'CPU_RAM_TYPE',
          `This CPU memory controller expects ${cpuS.ramType}.`,
          ['ram', 'cpu']
        );
      }
      if (mbS.maxRamSpeed && rs.speedMhz && rs.speedMhz > mbS.maxRamSpeed) {
        warnings.push({
          code: 'RAM_SPEED_CAPPED',
          message: `RAM is rated ${rs.speedMhz} MHz; board officially lists ${mbS.maxRamSpeed} MHz. It will run, likely at a lower JEDEC/XMP cap.`,
          fields: ['ram', 'motherboard'],
        });
      }
    }
    if (mbS.ramSlots && sticks > mbS.ramSlots) {
      push(
        errors,
        'RAM_SLOTS',
        `This kit uses ${sticks} DIMMs but the board only has ${mbS.ramSlots} slots.`,
        ['ram', 'motherboard']
      );
    }
    if (mbS.maxRamGb && totalGb > mbS.maxRamGb) {
      push(
        errors,
        'RAM_CAPACITY',
        `Total ${totalGb} GB exceeds the motherboard maximum of ${mbS.maxRamGb} GB.`,
        ['ram', 'motherboard']
      );
    }
  }

  if (!gpu && cpu && !cpuS.igpu && !allowIntegratedGpu) {
    push(errors, 'MISSING_GPU', 'This CPU has no iGPU — add a discrete graphics card.', ['gpu']);
  }
  if (!gpu && cpu && !cpuS.igpu) {
    warnings.push({
      code: 'NO_DISPLAY',
      message: 'No discrete GPU and this CPU has no integrated graphics. You will need a GPU for video output.',
      fields: ['gpu', 'cpu'],
    });
  }

  if (gpu && cabinet && gpuS.lengthMm && caseS.gpuMaxLengthMm) {
    if (gpuS.lengthMm > caseS.gpuMaxLengthMm) {
      push(
        errors,
        'GPU_LENGTH',
        `GPU length ${gpuS.lengthMm} mm exceeds cabinet clearance of ${caseS.gpuMaxLengthMm} mm.`,
        ['gpu', 'cabinet']
      );
    }
  }

  if (mb && cabinet) {
    const supported = Array.isArray(caseS.formFactors) ? caseS.formFactors : [];
    if (mbS.formFactor && supported.length && !supported.includes(mbS.formFactor)) {
      push(
        errors,
        'FORM_FACTOR',
        `Cabinet does not mount ${mbS.formFactor} boards (supports ${supported.join(', ')}).`,
        ['motherboard', 'cabinet']
      );
    }
  }

  if (cooler && cpu) {
    const sockets = Array.isArray(coolerS.sockets) ? coolerS.sockets : [];
    if (sockets.length && cpuS.socket && !sockets.includes(cpuS.socket)) {
      push(
        errors,
        'COOLER_SOCKET',
        `This cooler is not listed for socket ${cpuS.socket}.`,
        ['cooling', 'cpu']
      );
    }
  }

  if (cooler && cabinet) {
    if (coolerS.kind === 'AIR' && coolerS.heightMm && caseS.coolerMaxHeightMm) {
      if (coolerS.heightMm > caseS.coolerMaxHeightMm) {
        push(
          errors,
          'COOLER_HEIGHT',
          `Air cooler height ${coolerS.heightMm} mm exceeds cabinet limit ${caseS.coolerMaxHeightMm} mm.`,
          ['cooling', 'cabinet']
        );
      }
    }
    if (coolerS.kind === 'AIO' && coolerS.radiatorMm) {
      const rads = Array.isArray(caseS.radiatorMm) ? caseS.radiatorMm : [];
      if (rads.length && !rads.includes(coolerS.radiatorMm)) {
        push(
          errors,
          'RADIATOR',
          `Cabinet does not list a ${coolerS.radiatorMm} mm radiator mount.`,
          ['cooling', 'cabinet']
        );
      }
    }
  }

  if (mb && storages.length) {
    let m2 = 0;
    let sata = 0;
    for (const drive of storages) {
      const ds = spec(drive);
      const iface = (ds.interface || '').toUpperCase();
      if (iface === 'NVME' || ds.form === 'M.2') m2 += Number(drive.quantity || 1);
      if (iface === 'SATA') sata += Number(drive.quantity || 1);
    }
    if (mbS.m2Slots != null && m2 > mbS.m2Slots) {
      push(
        errors,
        'M2_SLOTS',
        `Build uses ${m2} M.2/NVMe drives; board has ${mbS.m2Slots} M.2 slot(s).`,
        ['storage', 'motherboard']
      );
    }
    if (mbS.sataPorts != null && sata > mbS.sataPorts) {
      push(
        errors,
        'SATA_PORTS',
        `Build uses ${sata} SATA drives; board has ${mbS.sataPorts} SATA port(s).`,
        ['storage', 'motherboard']
      );
    }
  }

  if (cabinet && storages.length) {
    let bay25 = 0;
    let bay35 = 0;
    for (const drive of storages) {
      const ds = spec(drive);
      if (ds.form === '2.5') bay25 += Number(drive.quantity || 1);
      if (ds.form === '3.5') bay35 += Number(drive.quantity || 1);
    }
    if (caseS.driveBays25 != null && bay25 > caseS.driveBays25) {
      push(errors, 'BAY_25', `Not enough 2.5" bays in this cabinet.`, ['storage', 'cabinet']);
    }
    if (caseS.driveBays35 != null && bay35 > caseS.driveBays35) {
      push(errors, 'BAY_35', `Not enough 3.5" bays in this cabinet.`, ['storage', 'cabinet']);
    }
  }

  const estimatedWatts = estimateSystemWattage(parts);
  const recommendedPsu = Math.ceil((estimatedWatts * 1.35) / 50) * 50;

  if (psu) {
    const wattage = Number(psuS.wattage || 0);
    if (wattage && wattage < estimatedWatts * 1.2) {
      push(
        errors,
        'PSU_WATTAGE',
        `Estimated load is ~${estimatedWatts} W. A ${wattage} W PSU is below the 20% headroom we require (need about ${recommendedPsu} W).`,
        ['psu']
      );
    } else if (wattage && wattage < recommendedPsu) {
      warnings.push({
        code: 'PSU_HEADROOM',
        message: `PSU is usable but tight. We recommend around ${recommendedPsu} W for this mix.`,
        fields: ['psu'],
      });
    }
    if (cabinet && psuS.formFactor && caseS.psuForm && psuS.formFactor !== caseS.psuForm) {
      push(
        errors,
        'PSU_FORM',
        `PSU form ${psuS.formFactor} does not match cabinet ${caseS.psuForm}.`,
        ['psu', 'cabinet']
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedWatts,
    recommendedPsu,
  };
}

export function normalizeParts(inputParts = []) {
  return inputParts
    .filter(Boolean)
    .map((p) => ({
      ...p,
      quantity: Number(p.quantity || 1),
      specs: spec(p),
    }));
}
