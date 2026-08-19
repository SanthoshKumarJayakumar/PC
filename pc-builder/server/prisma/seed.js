import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

function svgData(title, accent) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="100%" stop-color="#151b33"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <rect x="340" y="160" width="520" height="460" rx="28" fill="#1c243f" stroke="${accent}" stroke-width="4"/>
  <rect x="370" y="190" width="460" height="280" rx="12" fill="#0e1428"/>
  <circle cx="600" cy="330" r="70" fill="none" stroke="${accent}" stroke-width="6"/>
  <rect x="400" y="500" width="400" height="18" rx="9" fill="${accent}" opacity="0.8"/>
  <text x="600" y="720" text-anchor="middle" fill="#e8ecff" font-family="Segoe UI, sans-serif" font-size="36">${title}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function main() {
  console.log('Seeding AetherForge…');

  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.configurationComponent.deleteMany();
  await prisma.configuration.deleteMany();
  await prisma.productComponent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.componentCompatibility.deleteMany();
  await prisma.component.deleteMany();
  await prisma.componentCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const roles = await Promise.all(
    ['CUSTOMER', 'ADMIN', 'SUPPORT'].map((name) => prisma.role.create({ data: { name } }))
  );
  const role = Object.fromEntries(roles.map((r) => [r.name, r]));

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        mobile: '9000000001',
        passwordHash: await bcrypt.hash(adminPassword, 12),
        roleId: role.ADMIN.id,
        profile: {
          create: {
            firstName: process.env.ADMIN_FIRST_NAME || 'Aether',
            lastName: process.env.ADMIN_LAST_NAME || 'Admin',
            location: 'Chennai',
          },
        },
      },
    });
    console.log('Admin user seeded from env:', adminEmail);
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
  }

  const demoEmail = process.env.DEMO_EMAIL;
  const demoPassword = process.env.DEMO_PASSWORD;
  let demo = null;
  if (demoEmail && demoPassword) {
    demo = await prisma.user.create({
      data: {
        email: demoEmail.toLowerCase(),
        mobile: '9876543210',
        passwordHash: await bcrypt.hash(demoPassword, 12),
        roleId: role.CUSTOMER.id,
        profile: { create: { firstName: 'Aria', lastName: 'Mehta', location: 'Bengaluru' } },
      },
    });
    console.log('Demo customer seeded from env:', demoEmail);
  }

  const catSteps = [
    ['cpu', 'Processor', 1, true],
    ['motherboard', 'Motherboard', 2, true],
    ['ram', 'Memory', 3, true],
    ['gpu', 'Graphics', 4, false],
    ['storage', 'Storage', 5, true],
    ['cabinet', 'Cabinet', 6, true],
    ['psu', 'Power supply', 7, true],
    ['cooling', 'Cooling', 8, true],
    ['os', 'Operating system', 9, false],
    ['network', 'Wi-Fi / Bluetooth', 10, false],
    ['accessory', 'Accessories', 11, false],
    ['warranty', 'Warranty plan', 12, false],
  ];
  const cc = {};
  for (const [slug, name, stepOrder, required] of catSteps) {
    cc[slug] = await prisma.componentCategory.create({ data: { slug, name, stepOrder, required } });
  }

  async function addComp(category, data) {
    const row = await prisma.component.create({
      data: {
        categoryId: cc[category].id,
        slug: data.sku.toLowerCase(),
        ...data,
      },
    });
    await prisma.inventory.create({
      data: { componentId: row.id, quantity: 25, reason: 'SEED' },
    });
    return row;
  }

  await addComp('cpu', {
    name: 'Northstar i5-540',
    brand: 'Intel',
    sku: 'NS-I5-540',
    price: 18990,
    wattageEst: 65,
    description: '10-core fictional Intel-socket CPU for 1440p esports and office.',
    specs: { socket: 'LGA1700', chipsets: ['B760', 'Z790'], tdpWatts: 65, ramType: 'DDR5', igpu: false, cores: 10, threads: 16 },
  });
  const cpuI7 = await addComp('cpu', {
    name: 'Northstar i7-740K',
    brand: 'Intel',
    sku: 'NS-I7-740K',
    price: 34990,
    wattageEst: 125,
    description: 'Unlocked fictional Intel CPU for creators.',
    specs: { socket: 'LGA1700', chipsets: ['Z790'], tdpWatts: 125, ramType: 'DDR5', igpu: true, cores: 16, threads: 24 },
  });
  const cpuR5 = await addComp('cpu', {
    name: 'Ember 5 760',
    brand: 'AMD',
    sku: 'EM-5-760',
    price: 22990,
    wattageEst: 65,
    description: '6-core AM5 CPU with strong 1% lows.',
    specs: { socket: 'AM5', chipsets: ['B650', 'X670'], tdpWatts: 65, ramType: 'DDR5', igpu: true, cores: 6, threads: 12 },
  });
  await addComp('cpu', {
    name: 'Ember 7 780X',
    brand: 'AMD',
    sku: 'EM-7-780X',
    price: 42990,
    wattageEst: 120,
    description: '8-core 3D-cache style gaming chip (fictional).',
    specs: { socket: 'AM5', chipsets: ['B650', 'X670'], tdpWatts: 120, ramType: 'DDR5', igpu: false, cores: 8, threads: 16 },
  });

  await addComp('motherboard', {
    name: 'Ion Board B760-M WiFi',
    brand: 'Ion',
    sku: 'ION-B760M',
    price: 13990,
    wattageEst: 25,
    description: 'mATX B760 with DDR5 and dual M.2.',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'mATX', ramType: 'DDR5', ramSlots: 4, maxRamGb: 128, maxRamSpeed: 6400, m2Slots: 2, sataPorts: 4 },
  });
  const mbZ790 = await addComp('motherboard', {
    name: 'Ion Board Z790 Apex',
    brand: 'Ion',
    sku: 'ION-Z790',
    price: 24990,
    wattageEst: 30,
    description: 'ATX Z790 for unlocked Northstar CPUs.',
    specs: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', ramType: 'DDR5', ramSlots: 4, maxRamGb: 192, maxRamSpeed: 7200, m2Slots: 4, sataPorts: 6 },
  });
  const mbB650 = await addComp('motherboard', {
    name: 'ForgePlate B650M',
    brand: 'ForgePlate',
    sku: 'FP-B650M',
    price: 14990,
    wattageEst: 25,
    description: 'mATX AM5 with strong VRM.',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'mATX', ramType: 'DDR5', ramSlots: 4, maxRamGb: 128, maxRamSpeed: 6000, m2Slots: 2, sataPorts: 4 },
  });
  const mbX670 = await addComp('motherboard', {
    name: 'ForgePlate X670E',
    brand: 'ForgePlate',
    sku: 'FP-X670E',
    price: 28990,
    wattageEst: 35,
    description: 'Full ATX AM5 with PCIe 5.0.',
    specs: { socket: 'AM5', chipset: 'X670', formFactor: 'ATX', ramType: 'DDR4', ramSlots: 4, maxRamGb: 192, maxRamSpeed: 6400, m2Slots: 4, sataPorts: 6 },
  });
  // Fix X670 ramType to DDR5 - I accidentally set DDR4 which is useful as a trap... actually AM5 is DDR5. Let me use DDR5 for X670 and add a DDR4 board as incompatible trap.

  await prisma.component.update({
    where: { id: mbX670.id },
    data: { specs: { socket: 'AM5', chipset: 'X670', formFactor: 'ATX', ramType: 'DDR5', ramSlots: 4, maxRamGb: 192, maxRamSpeed: 6400, m2Slots: 4, sataPorts: 6 } },
  });

  await addComp('motherboard', {
    name: 'ForgePlate B450M Legacy',
    brand: 'ForgePlate',
    sku: 'FP-B450M',
    price: 7990,
    wattageEst: 20,
    description: 'Older AM4 DDR4 board — will fail with AM5 CPUs.',
    specs: { socket: 'AM4', chipset: 'B450', formFactor: 'mATX', ramType: 'DDR4', ramSlots: 4, maxRamGb: 64, maxRamSpeed: 3200, m2Slots: 1, sataPorts: 4 },
  });

  const ram16d5 = await addComp('ram', {
    name: 'VoltStick 16GB (2x8) DDR5-6000',
    brand: 'VoltStick',
    sku: 'VS-16-D5',
    price: 4990,
    wattageEst: 8,
    description: 'JEDEC/XMP DDR5 kit.',
    specs: { ramType: 'DDR5', speedMhz: 6000, capacityGb: 16, sticks: 2 },
  });
  const ram32d5 = await addComp('ram', {
    name: 'VoltStick 32GB (2x16) DDR5-6000',
    brand: 'VoltStick',
    sku: 'VS-32-D5',
    price: 8990,
    wattageEst: 10,
    description: '32 GB dual-rank kit.',
    specs: { ramType: 'DDR5', speedMhz: 6000, capacityGb: 32, sticks: 2 },
  });
  await addComp('ram', {
    name: 'VoltStick 16GB (2x8) DDR4-3200',
    brand: 'VoltStick',
    sku: 'VS-16-D4',
    price: 3290,
    wattageEst: 8,
    description: 'DDR4 kit for legacy boards only.',
    specs: { ramType: 'DDR4', speedMhz: 3200, capacityGb: 16, sticks: 2 },
  });

  const gpu4060 = await addComp('gpu', {
    name: 'Helix 4060 8G',
    brand: 'NVIDIA',
    sku: 'HX-4060',
    price: 28990,
    wattageEst: 115,
    description: 'Fictional Ada-class 1080p/1440p card.',
    specs: { lengthMm: 242, tdpWatts: 115, vramGb: 8 },
  });
  const gpu4070 = await addComp('gpu', {
    name: 'Helix 4070 Super 12G',
    brand: 'NVIDIA',
    sku: 'HX-4070S',
    price: 58990,
    wattageEst: 220,
    description: '1440p/4K raster card.',
    specs: { lengthMm: 304, tdpWatts: 220, vramGb: 12 },
  });
  await addComp('gpu', {
    name: 'Crimson 7600 8G',
    brand: 'AMD',
    sku: 'CR-7600',
    price: 24990,
    wattageEst: 165,
    description: 'RDNA-style 1080p card.',
    specs: { lengthMm: 204, tdpWatts: 165, vramGb: 8 },
  });
  const gpuLong = await addComp('gpu', {
    name: 'Helix 4090 Titan 24G',
    brand: 'NVIDIA',
    sku: 'HX-4090T',
    price: 189990,
    wattageEst: 450,
    description: 'Oversized flagship used to fail small-case clearance.',
    specs: { lengthMm: 360, tdpWatts: 450, vramGb: 24 },
  });

  const nvme1 = await addComp('storage', {
    name: 'Quill 1TB Gen4 NVMe',
    brand: 'Quill',
    sku: 'QL-1T-NVME',
    price: 6490,
    wattageEst: 6,
    description: 'PCIe 4.0 M.2 boot drive.',
    specs: { interface: 'NVME', form: 'M.2', pcieGen: 4, capacityGb: 1000 },
  });
  await addComp('storage', {
    name: 'Quill 1TB SATA SSD',
    brand: 'Quill',
    sku: 'QL-1T-SATA',
    price: 4490,
    wattageEst: 4,
    description: '2.5-inch SATA SSD.',
    specs: { interface: 'SATA', form: '2.5', capacityGb: 1000 },
  });
  await addComp('storage', {
    name: 'Quill 2TB HDD 7200',
    brand: 'Quill',
    sku: 'QL-2T-HDD',
    price: 4290,
    wattageEst: 7,
    description: '3.5-inch bulk storage.',
    specs: { interface: 'SATA', form: '3.5', capacityGb: 2000 },
  });

  const caseMini = await addComp('cabinet', {
    name: 'Nimbus Mini mATX',
    brand: 'Nimbus',
    sku: 'NB-MINI',
    price: 4990,
    wattageEst: 0,
    description: 'Compact case — tight GPU and cooler limits.',
    specs: { formFactors: ['mATX', 'ITX'], gpuMaxLengthMm: 280, coolerMaxHeightMm: 155, radiatorMm: [240], psuForm: 'ATX', driveBays25: 2, driveBays35: 1 },
  });
  const caseAtx = await addComp('cabinet', {
    name: 'Nimbus Flow ATX',
    brand: 'Nimbus',
    sku: 'NB-FLOW',
    price: 7990,
    wattageEst: 0,
    description: 'Mesh ATX mid-tower.',
    specs: { formFactors: ['ATX', 'mATX', 'ITX'], gpuMaxLengthMm: 380, coolerMaxHeightMm: 170, radiatorMm: [240, 280, 360], psuForm: 'ATX', driveBays25: 4, driveBays35: 2 },
  });

  const psu550 = await addComp('psu', {
    name: 'Arc 550W Bronze',
    brand: 'Arc',
    sku: 'ARC-550',
    price: 4490,
    wattageEst: 0,
    description: 'Entry ATX PSU.',
    specs: { wattage: 550, formFactor: 'ATX', rating: '80+ Bronze' },
  });
  const psu750 = await addComp('psu', {
    name: 'Arc 750W Gold',
    brand: 'Arc',
    sku: 'ARC-750',
    price: 8990,
    wattageEst: 0,
    description: 'Gold ATX for mid/high GPUs.',
    specs: { wattage: 750, formFactor: 'ATX', rating: '80+ Gold' },
  });
  const psu1200 = await addComp('psu', {
    name: 'Arc 1200W Plat',
    brand: 'Arc',
    sku: 'ARC-1200',
    price: 18990,
    wattageEst: 0,
    description: 'High-wattage unit for flagship GPUs.',
    specs: { wattage: 1200, formFactor: 'ATX', rating: '80+ Platinum' },
  });

  const coolAir = await addComp('cooling', {
    name: 'Glacier Dual Tower',
    brand: 'Glacier',
    sku: 'GL-DT',
    price: 3990,
    wattageEst: 5,
    description: 'Air cooler for LGA1700 and AM5.',
    specs: { kind: 'AIR', sockets: ['LGA1700', 'AM5', 'AM4'], heightMm: 158, tdpWatts: 220 },
  });
  const coolLow = await addComp('cooling', {
    name: 'Glacier Low-Profile',
    brand: 'Glacier',
    sku: 'GL-LP',
    price: 1990,
    wattageEst: 3,
    description: 'Short air cooler for SFF.',
    specs: { kind: 'AIR', sockets: ['LGA1700', 'AM5', 'AM4'], heightMm: 135, tdpWatts: 120 },
  });
  const coolAio = await addComp('cooling', {
    name: 'Glacier 360 AIO',
    brand: 'Glacier',
    sku: 'GL-360',
    price: 9990,
    wattageEst: 12,
    description: '360 mm liquid cooler.',
    specs: { kind: 'AIO', sockets: ['LGA1700', 'AM5'], radiatorMm: 360, tdpWatts: 300 },
  });

  await addComp('os', {
    name: 'Horizon OS Home (OEM)',
    brand: 'Horizon',
    sku: 'OS-HOME',
    price: 10990,
    wattageEst: 0,
    description: 'Fictional OEM OS license, installed at checkout.',
    specs: { kind: 'OS' },
  });
  await addComp('network', {
    name: 'AetherLink Wi-Fi 6E + BT 5.3',
    brand: 'AetherLink',
    sku: 'AL-WIFI',
    price: 1990,
    wattageEst: 3,
    description: 'PCIe adapter if the board has no wireless.',
    specs: { wifi: '6E', bluetooth: '5.3' },
  });
  await addComp('warranty', {
    name: 'ForgeCare +12 months onsite',
    brand: 'AetherForge',
    sku: 'WR-12',
    price: 2490,
    wattageEst: 0,
    description: 'Extends onsite coverage by one year.',
    specs: { extraMonths: 12 },
  });

  const pCats = {
    gaming: await prisma.productCategory.create({ data: { slug: 'gaming', name: 'Gaming', kind: 'PREBUILD' } }),
    creator: await prisma.productCategory.create({ data: { slug: 'creator', name: 'Creator', kind: 'PREBUILD' } }),
    office: await prisma.productCategory.create({ data: { slug: 'office', name: 'Productivity', kind: 'PREBUILD' } }),
    acc: await prisma.productCategory.create({ data: { slug: 'peripherals', name: 'Peripherals', kind: 'ACCESSORY' } }),
  };

  async function addProduct(p, parts) {
    const { qty, ...productData } = p;
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: [
            { url: svgData(p.name, '#7c5cff'), alt: `${p.name} front`, sortOrder: 0 },
            { url: svgData(`${p.name} interior`, '#3ee0c5'), alt: `${p.name} interior`, sortOrder: 1 },
          ],
        },
        components: {
          create: parts.map(([c, label]) => ({ componentId: c.id, label })),
        },
        inventory: { create: { quantity: qty ?? 8, reason: 'SEED' } },
      },
    });
    return product;
  }

  const ember = await addProduct(
    {
      slug: 'ember-pulse',
      name: 'Ember Pulse',
      subtitle: '1080p gaming under ₹85K',
      description:
        'A balanced AM5 gaming tower with discrete graphics, fast NVMe storage, and mesh airflow. Built for competitive titles and everyday creation.',
      kind: 'PREBUILD',
      categoryId: pCats.gaming.id,
      basePrice: 79990,
      tier: 'mid-range',
      purpose: 'gaming',
      warrantyNote: '3 months onsite; OEM parts 1–3 years.',
      deliveryNote: 'Free pan-India delivery. Typical dispatch 5–7 working days.',
      faq: [
        { q: 'Does it include a monitor?', a: 'No. Pair it from Peripherals or use your own display.' },
        { q: 'Can I upgrade RAM later?', a: 'Yes — two DIMM slots remain free on this board.' },
      ],
      qty: 12,
    },
    [
      [cpuR5, 'CPU'],
      [mbB650, 'Motherboard'],
      [ram16d5, 'Memory'],
      [gpu4060, 'GPU'],
      [nvme1, 'Storage'],
      [caseAtx, 'Cabinet'],
      [psu750, 'PSU'],
      [coolAir, 'Cooler'],
    ]
  );

  await addProduct(
    {
      slug: 'nova-drift',
      name: 'Nova Drift',
      subtitle: 'Creator workstation',
      description: 'Northstar i7 with a 4070-class GPU and 32 GB for timelines, 3D, and streaming.',
      kind: 'PREBUILD',
      categoryId: pCats.creator.id,
      basePrice: 149990,
      tier: 'high',
      purpose: 'content-creation',
      qty: 5,
    },
    [
      [cpuI7, 'CPU'],
      [mbZ790, 'Motherboard'],
      [ram32d5, 'Memory'],
      [gpu4070, 'GPU'],
      [nvme1, 'Storage'],
      [caseAtx, 'Cabinet'],
      [psu750, 'PSU'],
      [coolAio, 'Cooler'],
    ]
  );

  await addProduct(
    {
      slug: 'aurora-quill',
      name: 'Aurora Quill',
      subtitle: 'Quiet office companion',
      description: 'APU-style Ember CPU, compact case, and silent cooling for billing, Excel, and browsing.',
      kind: 'PREBUILD',
      categoryId: pCats.office.id,
      basePrice: 42990,
      tier: 'entry',
      purpose: 'productivity',
      qty: 20,
    },
    [
      [cpuR5, 'CPU'],
      [mbB650, 'Motherboard'],
      [ram16d5, 'Memory'],
      [nvme1, 'Storage'],
      [caseMini, 'Cabinet'],
      [psu550, 'PSU'],
      [coolLow, 'Cooler'],
    ]
  );

  await addProduct(
    {
      slug: 'forge-titan',
      name: 'Forge Titan',
      subtitle: '4K flagship',
      description: 'Unlocked Intel-socket build with a long 4090-class card. Needs a roomy ATX chassis.',
      kind: 'PREBUILD',
      categoryId: pCats.gaming.id,
      basePrice: 289990,
      tier: 'flagship',
      purpose: 'gaming',
      qty: 2,
    },
    [
      [cpuI7, 'CPU'],
      [mbZ790, 'Motherboard'],
      [ram32d5, 'Memory'],
      [gpuLong, 'GPU'],
      [nvme1, 'Storage'],
      [caseAtx, 'Cabinet'],
      [psu1200, 'PSU'],
      [coolAio, 'Cooler'],
    ]
  );

  await addProduct(
    {
      slug: 'vector-slate-monitor',
      name: 'Vector Slate 27 QHD 165Hz',
      subtitle: 'IPS monitor',
      description: '27-inch QHD IPS with 165 Hz and USB-C. Original AetherForge accessory line.',
      kind: 'ACCESSORY',
      categoryId: pCats.acc.id,
      basePrice: 18990,
      purpose: 'display',
      qty: 15,
    },
    []
  );

  if (demo) {
    await prisma.review.create({
      data: {
        userId: demo.id,
        productId: ember.id,
        rating: 5,
        title: 'Clean 1440p esports box',
        body: 'Quiet, tidy cable management, and the Ember 5 never thermal-throttled in a 2-hour session.',
        verified: true,
      },
    });
  }

  await prisma.coupon.create({
    data: {
      code: 'FORGE10',
      description: '10% off builds',
      percentOff: 10,
      minSubtotal: 30000,
      ...(demo ? { createdById: demo.id } : {}),
    },
  });

  const faqs = [
    ['Can I change parts after I pay?', 'Yes, within 24 hours of confirmation, from My Config or Support — as long as the new parts pass compatibility.'],
    ['Do you install games?', 'No. We can install the Horizon OS license if you add it in the configurator.'],
    ['How long is delivery?', 'Typically 5–7 working days after payment, pan-India. Metro onsite setup is available as an add-on.'],
    ['What is GST?', 'Listed prices are exclusive of GST in the configurator; the sticky summary shows GST (18%) and the grand total.'],
    ['Is EMI available?', 'Use your card issuer’s EMI at checkout when a production payment provider is connected. Test Payment is for local development only.'],
  ];
  for (const [i, [question, answer]] of faqs.entries()) {
    await prisma.faqItem.create({ data: { question, answer, sortOrder: i } });
  }

  await prisma.galleryItem.createMany({
    data: [
      { kind: 'gallery', title: 'Ember Pulse — midnight mesh', caption: 'Original SVG study', imageUrl: svgData('Ember Pulse', '#7c5cff') },
      { kind: 'gallery', title: 'Nova Drift — creator desk', caption: 'Studio lighting study', imageUrl: svgData('Nova Drift', '#3ee0c5') },
      { kind: 'wallpaper', title: 'Forge mark — 4K wallpaper', caption: 'Geometric sigil', imageUrl: svgData('AetherForge', '#f0c36a') },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
