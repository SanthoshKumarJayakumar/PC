import { prisma } from '../lib/prisma.js';
import { validateCompatibility, normalizeParts } from './compatibility.js';
import { priceBreakdown } from '../lib/pricing.js';
import { HttpError } from '../lib/http.js';

export async function loadComponentsByIds(selections) {
  const ids = selections.map((s) => s.componentId);
  const components = await prisma.component.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { category: true },
  });
  const byId = Object.fromEntries(components.map((c) => [c.id, c]));
  return selections.map((s) => {
    const c = byId[s.componentId];
    if (!c) throw new HttpError(400, `Unknown component: ${s.componentId}`);
    return { ...c, quantity: s.quantity || 1, slot: s.slot || null };
  });
}

export function priceParts(parts, coupon) {
  const subtotal = parts.reduce((sum, p) => sum + Number(p.price) * (p.quantity || 1), 0);
  let discount = 0;
  if (coupon?.active) {
    if (coupon.percentOff) discount = (subtotal * coupon.percentOff) / 100;
    if (coupon.amountOff) discount = Number(coupon.amountOff);
    if (Number(coupon.minSubtotal) > subtotal) discount = 0;
  }
  return priceBreakdown(subtotal, { discount });
}

export async function evaluateSelection(selections, couponCode) {
  const parts = normalizeParts(await loadComponentsByIds(selections));
  const compatibility = validateCompatibility(parts);
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
  }
  const pricing = priceParts(parts, coupon);
  return { parts, compatibility, pricing, coupon };
}
