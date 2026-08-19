import { describe, expect, it } from 'vitest';
import { validateCompatibility, estimateSystemWattage } from '../src/services/compatibility.js';

function part(categorySlug, specs, extras = {}) {
  return {
    category: { slug: categorySlug },
    specs,
    wattageEst: extras.wattageEst || specs.tdpWatts || 0,
    quantity: extras.quantity || 1,
    price: extras.price || 0,
    name: extras.name || categorySlug,
  };
}

const validBase = () => [
  part('cpu', { socket: 'AM5', chipsets: ['B650'], ramType: 'DDR5', tdpWatts: 65, igpu: true }),
  part('motherboard', {
    socket: 'AM5',
    chipset: 'B650',
    formFactor: 'mATX',
    ramType: 'DDR5',
    ramSlots: 4,
    maxRamGb: 128,
    maxRamSpeed: 6000,
    m2Slots: 2,
    sataPorts: 4,
  }),
  part('ram', { ramType: 'DDR5', speedMhz: 6000, capacityGb: 32, sticks: 2 }),
  part('gpu', { lengthMm: 250, tdpWatts: 115 }),
  part('storage', { interface: 'NVME', form: 'M.2' }),
  part('cabinet', {
    formFactors: ['ATX', 'mATX'],
    gpuMaxLengthMm: 320,
    coolerMaxHeightMm: 165,
    radiatorMm: [240, 360],
    psuForm: 'ATX',
    driveBays25: 2,
    driveBays35: 1,
  }),
  part('psu', { wattage: 750, formFactor: 'ATX' }),
  part('cooling', { kind: 'AIR', sockets: ['AM5', 'LGA1700'], heightMm: 158 }),
];

describe('compatibility engine', () => {
  it('accepts a coherent AM5 build', () => {
    const result = validateCompatibility(validBase());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.estimatedWatts).toBeGreaterThan(50);
  });

  it('blocks CPU/motherboard socket mismatch', () => {
    const parts = validBase();
    parts[0] = part('cpu', { socket: 'LGA1700', chipsets: ['B760'], ramType: 'DDR5', tdpWatts: 65 });
    const result = validateCompatibility(parts);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SOCKET_MISMATCH')).toBe(true);
  });

  it('blocks DDR4 RAM on a DDR5 board', () => {
    const parts = validBase();
    parts[2] = part('ram', { ramType: 'DDR4', speedMhz: 3200, capacityGb: 16, sticks: 2 });
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'RAM_TYPE')).toBe(true);
  });

  it('blocks GPU that is longer than the case', () => {
    const parts = validBase();
    parts[3] = part('gpu', { lengthMm: 400, tdpWatts: 450 }, { wattageEst: 450 });
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'GPU_LENGTH')).toBe(true);
  });

  it('blocks undersized PSU', () => {
    const parts = validBase();
    parts[3] = part('gpu', { lengthMm: 250, tdpWatts: 450 }, { wattageEst: 450 });
    parts[6] = part('psu', { wattage: 450, formFactor: 'ATX' });
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'PSU_WATTAGE')).toBe(true);
  });

  it('blocks cooler socket and height issues', () => {
    const parts = validBase();
    parts[7] = part('cooling', { kind: 'AIR', sockets: ['LGA1700'], heightMm: 180 });
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'COOLER_SOCKET')).toBe(true);
  });

  it('blocks too many M.2 drives', () => {
    const parts = validBase();
    parts.push(part('storage', { interface: 'NVME', form: 'M.2' }));
    parts.push(part('storage', { interface: 'NVME', form: 'M.2' }));
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'M2_SLOTS')).toBe(true);
  });

  it('blocks motherboard form factor vs cabinet', () => {
    const parts = validBase();
    parts[1] = part('motherboard', {
      socket: 'AM5',
      chipset: 'B650',
      formFactor: 'EATX',
      ramType: 'DDR5',
      ramSlots: 4,
      maxRamGb: 128,
      m2Slots: 2,
      sataPorts: 4,
    });
    const result = validateCompatibility(parts);
    expect(result.errors.some((e) => e.code === 'FORM_FACTOR')).toBe(true);
  });

  it('estimates wattage as idle + part TDPs', () => {
    const watts = estimateSystemWattage([
      part('cpu', { tdpWatts: 100 }),
      part('gpu', { tdpWatts: 200 }),
    ]);
    expect(watts).toBe(350);
  });
});
