import { describe, expect, it } from 'vitest';
import { priceBreakdown } from '../src/lib/pricing.js';
import { getPaymentProvider, TestPaymentProvider, CodProvider } from '../src/services/payment/index.js';

describe('pricing', () => {
  it('applies 18% GST and delivery on discounted subtotal', () => {
    const result = priceBreakdown(10000, { discount: 1000, deliveryFee: 0 });
    expect(result.subtotal).toBe(10000);
    expect(result.discount).toBe(1000);
    expect(result.gstAmount).toBe(1620);
    expect(result.total).toBe(10620);
  });
});

describe('payment providers', () => {
  it('selects test and cod factories', () => {
    expect(getPaymentProvider('test')).toBeInstanceOf(TestPaymentProvider);
    expect(getPaymentProvider('cod')).toBeInstanceOf(CodProvider);
  });

  it('test provider captures unless fail flag is set', async () => {
    const p = new TestPaymentProvider();
    const created = await p.createPayment({ orderId: 'abc', amount: 100 });
    const ok = await p.verifyPayment({ paymentId: created.paymentId, payload: {} });
    expect(ok.status).toBe('CAPTURED');
    const fail = await p.verifyPayment({ paymentId: created.paymentId, payload: { fail: true } });
    expect(fail.status).toBe('FAILED');
  });

  it('COD authorizes without capture', async () => {
    const p = new CodProvider();
    const created = await p.createPayment({ orderId: 'xyz', amount: 50 });
    expect(created.status).toBe('AUTHORIZED');
  });
});
