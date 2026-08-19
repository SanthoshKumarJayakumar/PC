import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const prisma = new PrismaClient();

function xf(pos, exploded, extra = {}) {
  const [x, y, z] = pos;
  const [ex, ey, ez] = exploded;
  return {
    assembledTransform: { x, y, z, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
    explodedTransform: { x: x + ex, y: y + ey, z: z + ez, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
    positionX: x,
    positionY: y,
    positionZ: z,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    ...extra,
  };
}

const SLOTS = {
  cpu: xf([0, 0.12, -0.02], [0, 0.08, 0], { mountPoint: "cpu_socket" }),
  motherboard: xf([0, 0.08, -0.04], [0, 0, -0.12], { mountPoint: "mb_tray" }),
  gpu: xf([0.02, 0.04, 0.06], [0.16, 0, 0.08], { mountPoint: "pcie" }),
  ram: xf([0.06, 0.14, -0.02], [0, 0.12, 0], { mountPoint: "dimm" }),
  storage: xf([-0.05, 0.02, -0.08], [-0.08, 0, -0.06], { mountPoint: "m2" }),
  cooler: xf([0, 0.2, -0.02], [0, 0.16, 0], { mountPoint: "cpu_top" }),
  cabinet: xf([0, 0, 0], [0, 0, 0], { mountPoint: "origin" }),
  psu: xf([0, -0.16, 0.02], [0, -0.14, 0], { mountPoint: "psu_bay" }),
  fans: xf([0, 0.08, 0.16], [0, 0, 0.14], { mountPoint: "front_fan" }),
};

async function part(categoryId, data) {
  const { slot, stock = 24, ...rest } = data;
  const t = SLOTS[slot] || SLOTS.cabinet;
  const created = await prisma.component.create({
    data: {
      ...rest,
      categoryId,
      inventory: { create: { stock, reserved: 0, lowStockThreshold: 3 } },
      models: {
        create: {
          modelUrl: null,
          thumbnailUrl: rest.image || null,
          ...t,
          boundingBox: rest.dimensions,
          active: true,
        },
      },
    },
  });
  return created;
}

async function main() {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.savedBuild.deleteMany();
  await prisma.configurationComponent.deleteMany();
  await prisma.configuration.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.review.deleteMany();
  await prisma.address.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.component3DModel.deleteMany();
  await prisma.component.deleteMany();
  await prisma.category.deleteMany();
  await prisma.compatibilityRule.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const cats = {};
  const catDefs = [
    ["cpu", "CPU", 1, true],
    ["motherboard", "Motherboard", 2, true],
    ["ram", "Memory", 3, true],
    ["gpu", "Graphics", 4, true],
    ["storage", "Storage", 5, true],
    ["cooler", "Cooling", 6, true],
    ["cabinet", "Cabinet", 7, true],
    ["psu", "Power Supply", 8, true],
    ["fans", "Fans", 9, false],
    ["os", "Operating System", 10, false],
    ["accessories", "Accessories", 11, false],
  ];
  for (const [slug, name, sortOrder, required] of catDefs) {
    cats[slug] = await prisma.category.create({ data: { slug, name, sortOrder, required } });
  }

  const cpu5 = await part(cats.cpu.id, {
    slot: "cpu",
    sku: "KL-HX-5600",
    name: "Helix 5600",
    slug: "helix-5600",
    brand: "Helix Silicon",
    description: "6-core workstation/gaming CPU. AM5-class fictional socket HX5.",
    price: 14990,
    powerConsumption: 65,
    specifications: { cores: 6, threads: 12, boostGhz: 4.4, tdp: 65 },
    compatibilityMetadata: { socket: "HX5", chipsets: ["HX550", "HX570"] },
    dimensions: { length: 0.04, width: 0.04, height: 0.008 },
  });
  const cpu7 = await part(cats.cpu.id, {
    slot: "cpu",
    sku: "KL-HX-7800",
    name: "Helix 7800X",
    slug: "helix-7800x",
    brand: "Helix Silicon",
    description: "8-core gaming CPU on socket HX5.",
    price: 28990,
    powerConsumption: 120,
    specifications: { cores: 8, threads: 16, boostGhz: 5.0, tdp: 120 },
    compatibilityMetadata: { socket: "HX5", chipsets: ["HX550", "HX570"] },
    dimensions: { length: 0.04, width: 0.04, height: 0.008 },
  });
  const cpu9 = await part(cats.cpu.id, {
    slot: "cpu",
    sku: "KL-AG-9400",
    name: "Aegis 9400K",
    slug: "aegis-9400k",
    brand: "Aegis Compute",
    description: "High-core creator CPU on incompatible socket AG8 — used to test mismatch.",
    price: 42990,
    powerConsumption: 125,
    specifications: { cores: 16, threads: 24, boostGhz: 5.4, tdp: 125 },
    compatibilityMetadata: { socket: "AG8", chipsets: ["AG890"] },
    dimensions: { length: 0.045, width: 0.045, height: 0.008 },
  });

  const mbAtx = await part(cats.motherboard.id, {
    slot: "motherboard",
    sku: "KL-MB-HX570",
    name: "ForgePlate HX570 ATX",
    slug: "forgeplate-hx570-atx",
    brand: "ForgePlate",
    description: "ATX board, DDR5, socket HX5.",
    price: 18990,
    powerConsumption: 50,
    specifications: { formFactor: "ATX", ramSlots: 4, maxRamGb: 192, m2Slots: 3, sataPorts: 4 },
    compatibilityMetadata: {
      socket: "HX5",
      chipset: "HX570",
      ramGen: "DDR5",
      formFactor: "ATX",
      ramSlots: 4,
      maxRamGb: 192,
      m2Slots: 3,
      sataPorts: 4,
    },
    dimensions: { length: 0.305, width: 0.244, height: 0.006 },
  });
  const mbMatx = await part(cats.motherboard.id, {
    slot: "motherboard",
    sku: "KL-MB-HX550M",
    name: "ForgePlate HX550 Micro-ATX",
    slug: "forgeplate-hx550-matx",
    brand: "ForgePlate",
    description: "Micro-ATX, DDR5, socket HX5.",
    price: 12990,
    powerConsumption: 40,
    specifications: { formFactor: "Micro-ATX", ramSlots: 2, maxRamGb: 96, m2Slots: 2, sataPorts: 4 },
    compatibilityMetadata: {
      socket: "HX5",
      chipset: "HX550",
      ramGen: "DDR5",
      formFactor: "Micro-ATX",
      ramSlots: 2,
      maxRamGb: 96,
      m2Slots: 2,
      sataPorts: 4,
    },
    dimensions: { length: 0.244, width: 0.244, height: 0.006 },
  });
  const mbDdr4 = await part(cats.motherboard.id, {
    slot: "motherboard",
    sku: "KL-MB-AG890",
    name: "ForgePlate AG890 E-ATX",
    slug: "forgeplate-ag890-eatx",
    brand: "ForgePlate",
    description: "E-ATX AG8 socket, DDR4 only — incompatible with Helix CPUs and DDR5 kits.",
    price: 24990,
    powerConsumption: 55,
    specifications: { formFactor: "E-ATX", ramSlots: 8, maxRamGb: 256, m2Slots: 4, sataPorts: 8 },
    compatibilityMetadata: {
      socket: "AG8",
      chipset: "AG890",
      ramGen: "DDR4",
      formFactor: "E-ATX",
      ramSlots: 8,
      maxRamGb: 256,
      m2Slots: 4,
      sataPorts: 8,
    },
    dimensions: { length: 0.305, width: 0.33, height: 0.006 },
  });

  const ram32 = await part(cats.ram.id, {
    slot: "ram",
    sku: "KL-RAM-32D5",
    name: "Ionix 32GB DDR5-6000",
    slug: "ionix-32-ddr5",
    brand: "Ionix",
    description: "2x16GB DDR5 kit.",
    price: 9990,
    powerConsumption: 12,
    specifications: { gen: "DDR5", capacityGb: 32, speed: 6000, sticks: 2 },
    compatibilityMetadata: { ramGen: "DDR5", capacityGb: 32, sticks: 2, speed: 6000 },
    dimensions: { length: 0.133, width: 0.008, height: 0.04 },
  });
  const ram64 = await part(cats.ram.id, {
    slot: "ram",
    sku: "KL-RAM-64D5",
    name: "Ionix 64GB DDR5-6400",
    slug: "ionix-64-ddr5",
    brand: "Ionix",
    description: "2x32GB DDR5 kit.",
    price: 18990,
    powerConsumption: 16,
    specifications: { gen: "DDR5", capacityGb: 64, speed: 6400, sticks: 2 },
    compatibilityMetadata: { ramGen: "DDR5", capacityGb: 64, sticks: 2, speed: 6400 },
    dimensions: { length: 0.133, width: 0.008, height: 0.045 },
  });
  const ramDdr4 = await part(cats.ram.id, {
    slot: "ram",
    sku: "KL-RAM-16D4",
    name: "Ionix 16GB DDR4-3200",
    slug: "ionix-16-ddr4",
    brand: "Ionix",
    description: "DDR4 kit — fails DDR5 boards.",
    price: 3990,
    powerConsumption: 8,
    specifications: { gen: "DDR4", capacityGb: 16, speed: 3200, sticks: 2 },
    compatibilityMetadata: { ramGen: "DDR4", capacityGb: 16, sticks: 2, speed: 3200 },
    dimensions: { length: 0.133, width: 0.008, height: 0.032 },
  });

  const gpu70 = await part(cats.gpu.id, {
    slot: "gpu",
    sku: "KL-GPU-V70",
    name: "Voltara V70 12GB",
    slug: "voltara-v70",
    brand: "Voltara",
    description: "1080p/1440p class fictional GPU. 270mm.",
    price: 42990,
    powerConsumption: 220,
    specifications: { vramGb: 12, lengthMm: 270, slots: 2, tdp: 220 },
    compatibilityMetadata: { lengthMm: 270, heightMm: 120, slots: 2, minPsuW: 650, pciePower: ["8pin"] },
    dimensions: { length: 0.27, width: 0.12, height: 0.04 },
  });
  const gpu90 = await part(cats.gpu.id, {
    slot: "gpu",
    sku: "KL-GPU-V90",
    name: "Voltara V90 16GB",
    slug: "voltara-v90",
    brand: "Voltara",
    description: "High-end 336mm GPU — will not fit compact cases.",
    price: 89990,
    powerConsumption: 320,
    specifications: { vramGb: 16, lengthMm: 336, slots: 3, tdp: 320 },
    compatibilityMetadata: { lengthMm: 336, heightMm: 140, slots: 3, minPsuW: 750, pciePower: ["16pin"] },
    dimensions: { length: 0.336, width: 0.14, height: 0.06 },
  });
  const gpuC = await part(cats.gpu.id, {
    slot: "gpu",
    sku: "KL-GPU-C68",
    name: "Crimson C68 16GB",
    slug: "crimson-c68",
    brand: "Crimson Silicon",
    description: "Raster/creator dual-use GPU, 280mm.",
    price: 52990,
    powerConsumption: 250,
    specifications: { vramGb: 16, lengthMm: 280, slots: 2.5, tdp: 250 },
    compatibilityMetadata: { lengthMm: 280, heightMm: 125, slots: 2.5, minPsuW: 650, pciePower: ["8pin", "8pin"] },
    dimensions: { length: 0.28, width: 0.125, height: 0.05 },
  });

  const ssd1 = await part(cats.storage.id, {
    slot: "storage",
    sku: "KL-SSD-1T",
    name: "Quanta 1TB NVMe Gen4",
    slug: "quanta-1tb-gen4",
    brand: "Quanta",
    description: "M.2 2280 NVMe.",
    price: 6990,
    powerConsumption: 6,
    specifications: { interface: "NVMe", gen: 4, capacityGb: 1000, form: "M.2" },
    compatibilityMetadata: { interface: "NVMe", form: "M.2" },
    dimensions: { length: 0.08, width: 0.022, height: 0.004 },
  });
  const ssd2 = await part(cats.storage.id, {
    slot: "storage",
    sku: "KL-SSD-2T",
    name: "Quanta 2TB NVMe Gen4",
    slug: "quanta-2tb-gen4",
    brand: "Quanta",
    description: "M.2 2280 NVMe.",
    price: 12990,
    powerConsumption: 7,
    specifications: { interface: "NVMe", gen: 4, capacityGb: 2000, form: "M.2" },
    compatibilityMetadata: { interface: "NVMe", form: "M.2" },
    dimensions: { length: 0.08, width: 0.022, height: 0.004 },
  });
  const hdd = await part(cats.storage.id, {
    slot: "storage",
    sku: "KL-HDD-4T",
    name: "Quanta 4TB SATA HDD",
    slug: "quanta-4tb-hdd",
    brand: "Quanta",
    description: "3.5\" SATA drive.",
    price: 7990,
    powerConsumption: 8,
    specifications: { interface: "SATA", capacityGb: 4000, form: "3.5" },
    compatibilityMetadata: { interface: "SATA", form: "3.5" },
    dimensions: { length: 0.147, width: 0.102, height: 0.026 },
  });

  const air = await part(cats.cooler.id, {
    slot: "cooler",
    sku: "KL-CL-AIR",
    name: "Glacier Dual Tower",
    slug: "glacier-dual-tower",
    brand: "Glacier",
    description: "165mm air cooler, HX5 + AG8.",
    price: 5490,
    powerConsumption: 6,
    specifications: { type: "air", heightMm: 165, sockets: ["HX5", "AG8"] },
    compatibilityMetadata: { type: "air", heightMm: 165, sockets: ["HX5", "AG8"], radiatorMm: 0 },
    dimensions: { length: 0.14, width: 0.13, height: 0.165 },
  });
  const aio = await part(cats.cooler.id, {
    slot: "cooler",
    sku: "KL-CL-360",
    name: "Glacier 360 AIO",
    slug: "glacier-360-aio",
    brand: "Glacier",
    description: "360mm AIO — needs 360 radiator support.",
    price: 12990,
    powerConsumption: 18,
    specifications: { type: "aio", heightMm: 55, radiatorMm: 360, sockets: ["HX5", "AG8"] },
    compatibilityMetadata: { type: "aio", heightMm: 55, sockets: ["HX5", "AG8"], radiatorMm: 360 },
    dimensions: { length: 0.394, width: 0.12, height: 0.027 },
  });

  const caseAtx = await part(cats.cabinet.id, {
    slot: "cabinet",
    sku: "KL-CS-ATX",
    name: "Casework Shift ATX",
    slug: "casework-shift-atx",
    brand: "Casework",
    description: "Mid-tower, 380mm GPU, 170mm cooler, 360 rad.",
    price: 8990,
    powerConsumption: 0,
    specifications: { formFactor: ["ATX", "Micro-ATX", "Mini-ITX"], gpuMm: 380, coolerMm: 170 },
    compatibilityMetadata: {
      formFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      gpuClearanceMm: 380,
      coolerClearanceMm: 170,
      radiators: [120, 240, 360],
      psuLengthMm: 180,
    },
    dimensions: { length: 0.45, width: 0.22, height: 0.48 },
  });
  const caseSmall = await part(cats.cabinet.id, {
    slot: "cabinet",
    sku: "KL-CS-ITX",
    name: "Casework Pocket Mini-ITX",
    slug: "casework-pocket-itx",
    brand: "Casework",
    description: "Compact case, 250mm GPU — incompatible with V90.",
    price: 7490,
    powerConsumption: 0,
    specifications: { formFactor: ["Mini-ITX", "Micro-ATX"], gpuMm: 250, coolerMm: 140 },
    compatibilityMetadata: {
      formFactors: ["Mini-ITX", "Micro-ATX"],
      gpuClearanceMm: 250,
      coolerClearanceMm: 140,
      radiators: [120],
      psuLengthMm: 140,
    },
    dimensions: { length: 0.35, width: 0.18, height: 0.32 },
  });

  const psu650 = await part(cats.psu.id, {
    slot: "psu",
    sku: "KL-PSU-650",
    name: "Pulse 650W Gold",
    slug: "pulse-650-gold",
    brand: "Pulse",
    description: "Undersized for V90 — used for PSU_INSUFFICIENT tests.",
    price: 6990,
    powerConsumption: 0,
    specifications: { wattage: 650, efficiency: "80+ Gold", lengthMm: 140 },
    compatibilityMetadata: { wattage: 650, efficiency: "Gold", connectors: ["8pin"] },
    dimensions: { length: 0.14, width: 0.15, height: 0.086 },
  });
  const psu750 = await part(cats.psu.id, {
    slot: "psu",
    sku: "KL-PSU-750",
    name: "Pulse 750W Gold",
    slug: "pulse-750-gold",
    brand: "Pulse",
    description: "Recommended for V70/C68.",
    price: 8990,
    powerConsumption: 0,
    specifications: { wattage: 750, efficiency: "80+ Gold", lengthMm: 150 },
    compatibilityMetadata: { wattage: 750, efficiency: "Gold", connectors: ["8pin", "8pin"] },
    dimensions: { length: 0.15, width: 0.15, height: 0.086 },
  });
  const psu1000 = await part(cats.psu.id, {
    slot: "psu",
    sku: "KL-PSU-1000",
    name: "Pulse 1000W Platinum",
    slug: "pulse-1000-plat",
    brand: "Pulse",
    description: "High-capacity PSU for V90 / AI builds.",
    price: 15990,
    powerConsumption: 0,
    specifications: { wattage: 1000, efficiency: "80+ Platinum", lengthMm: 160 },
    compatibilityMetadata: { wattage: 1000, efficiency: "Platinum", connectors: ["16pin", "8pin"] },
    dimensions: { length: 0.16, width: 0.15, height: 0.086 },
  });

  const fan = await part(cats.fans.id, {
    slot: "fans",
    sku: "KL-FAN-120",
    name: "Glacier 120 RGB Triple",
    slug: "glacier-120-rgb",
    brand: "Glacier",
    description: "3x120mm RGB fans.",
    price: 3490,
    powerConsumption: 9,
    specifications: { sizeMm: 120, count: 3, rgb: true },
    compatibilityMetadata: { sizeMm: 120, count: 3, rgb: true },
    dimensions: { length: 0.12, width: 0.12, height: 0.025 },
    stock: 40,
  });

  await part(cats.os.id, {
    slot: "cabinet",
    sku: "KL-OS-PRO",
    name: "Northwind OS Pro",
    slug: "northwind-os-pro",
    brand: "Northwind",
    description: "Fictional licensed OS image (placeholder).",
    price: 11990,
    powerConsumption: 0,
    specifications: { edition: "Pro" },
    compatibilityMetadata: {},
    dimensions: { length: 0, width: 0, height: 0 },
    stock: 99,
  });
  await part(cats.accessories.id, {
    slot: "cabinet",
    sku: "KL-WIFI",
    name: "Ionix Wi-Fi 6E Card",
    slug: "ionix-wifi-6e",
    brand: "Ionix",
    description: "PCIe wireless card.",
    price: 2490,
    powerConsumption: 4,
    specifications: { wifi: "6E", bt: "5.3" },
    compatibilityMetadata: {},
    dimensions: { length: 0.08, width: 0.02, height: 0.01 },
  });

  await prisma.compatibilityRule.createMany({
    data: [
      { code: "SOCKET_MATCH", name: "CPU socket must match motherboard", params: { type: "cpu_mb_socket" } },
      { code: "RAM_GENERATION", name: "RAM generation must match board", params: { type: "ram_mb_gen" } },
      { code: "MB_CASE_FF", name: "Motherboard form factor vs case", params: { type: "mb_case_ff" } },
      { code: "GPU_LENGTH", name: "GPU length vs case clearance", params: { type: "gpu_case_length" } },
      { code: "PSU_WATTAGE", name: "PSU vs estimated load and GPU min", params: { type: "psu_wattage", headroom: 1.3 } },
      { code: "COOLER_SOCKET", name: "Cooler socket support", params: { type: "cooler_socket" } },
      { code: "COOLER_HEIGHT", name: "Air cooler height vs case", params: { type: "cooler_height" } },
      { code: "RADIATOR", name: "AIO radiator vs case mounts", params: { type: "radiator" } },
      { code: "STORAGE_INTERFACE", name: "M.2 / SATA availability", params: { type: "storage" } },
    ],
  });

  await prisma.coupon.create({
    data: { code: "KAELON10", percentOff: 10, active: true },
  });

  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "change-me-admin", 12);
  const demoHash = await bcrypt.hash(process.env.DEMO_PASSWORD || "change-me-demo", 12);
  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@kaelon.local",
      passwordHash: adminHash,
      firstName: "Kaelon",
      lastName: "Admin",
      mobile: "9999990000",
      role: "ADMIN",
    },
  });
  const demo = await prisma.user.create({
    data: {
      email: process.env.DEMO_EMAIL || "demo@kaelon.local",
      passwordHash: demoHash,
      firstName: "Demo",
      lastName: "Builder",
      mobile: "9999990001",
      role: "CUSTOMER",
    },
  });

  async function prebuilt(name, category, parts, featured = true) {
    const cfg = await prisma.configuration.create({
      data: {
        userId: demo.id,
        name,
        shareId: nanoid(10),
        isPublic: true,
        isPrebuilt: true,
        prebuiltCategory: category,
        featured,
        rgb: { enabled: true, mode: "static", color: "#00eaff", speed: 1, brightness: 0.75 },
      },
    });
    let i = 0;
    for (const [slot, component] of parts) {
      await prisma.configurationComponent.create({
        data: { configurationId: cfg.id, componentId: component.id, slot, quantity: 1, sortOrder: i++ },
      });
    }
    return cfg;
  }

  await prebuilt("Kaelon Starter", "Starter Gaming", [
    ["cpu", cpu5],
    ["motherboard", mbMatx],
    ["ram", ram32],
    ["gpu", gpu70],
    ["storage", ssd1],
    ["cooler", air],
    ["cabinet", caseAtx],
    ["psu", psu750],
    ["fans", fan],
  ]);
  await prebuilt("Kaelon Apex", "High-End Gaming", [
    ["cpu", cpu7],
    ["motherboard", mbAtx],
    ["ram", ram64],
    ["gpu", gpu90],
    ["storage", ssd2],
    ["cooler", aio],
    ["cabinet", caseAtx],
    ["psu", psu1000],
    ["fans", fan],
  ]);
  await prebuilt("Kaelon Studio", "Creator", [
    ["cpu", cpu7],
    ["motherboard", mbAtx],
    ["ram", ram64],
    ["gpu", gpuC],
    ["storage", ssd2],
    ["cooler", aio],
    ["cabinet", caseAtx],
    ["psu", psu750],
    ["fans", fan],
  ]);
  await prebuilt("Kaelon Vector", "AI Workstation", [
    ["cpu", cpu9],
    ["motherboard", mbDdr4],
    ["ram", ramDdr4],
    ["gpu", gpu90],
    ["storage", ssd2],
    ["cooler", aio],
    ["cabinet", caseAtx],
    ["psu", psu1000],
    ["fans", fan],
  ]);

  console.log("Kaelon seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
