import { env } from '../config/env.js';
import { money } from './http.js';

export function priceBreakdown(subtotal, { discount = 0, deliveryFee = env.deliveryFee } = {}) {
  const safeSub = money(Math.max(0, Number(subtotal) || 0));
  const safeDiscount = money(Math.min(safeSub, Math.max(0, Number(discount) || 0)));
  const taxable = money(safeSub - safeDiscount);
  const gstAmount = money(taxable * env.gstRate);
  const delivery = money(deliveryFee);
  const total = money(taxable + gstAmount + delivery);
  return {
    subtotal: safeSub,
    discount: safeDiscount,
    gstRate: env.gstRate,
    gstAmount,
    deliveryFee: delivery,
    total,
  };
}
