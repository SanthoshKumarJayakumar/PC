import { env } from "../config/env.js";

export function computePower(parts) {
  const lines = parts.map((p) => ({
    slot: p.slot,
    name: p.component?.name,
    watts: Number(p.component?.powerConsumption || 0),
  }));
  const estimatedLoad = lines.reduce((s, l) => s + l.watts, 0) + 30;
  return { lines, estimatedLoad, headroomFactor: env.psuHeadroom };
}

export function recommendPsuWattage(estimatedLoad, availableWattages = [550, 650, 750, 850, 1000, 1200]) {
  const target = Math.ceil(estimatedLoad * env.psuHeadroom);
  const match = availableWattages.find((w) => w >= target);
  return match || availableWattages[availableWattages.length - 1];
}

export function computePricing(unitPrices, coupon) {
  const subtotal = unitPrices.reduce((s, n) => s + Number(n), 0);
  let discount = 0;
  if (coupon?.percentOff) discount = Math.round((subtotal * coupon.percentOff) / 100);
  if (coupon?.amountOff) discount += Number(coupon.amountOff);
  discount = Math.min(discount, subtotal);
  const taxable = subtotal - discount;
  const gst = Math.round(taxable * env.gstRate);
  const delivery = taxable >= env.freeDeliveryOver ? 0 : env.deliveryFee;
  const total = taxable + gst + delivery;
  return { subtotal, discount, gst, delivery, total, gstRate: env.gstRate };
}
