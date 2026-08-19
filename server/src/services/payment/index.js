export class TestPaymentProvider {
  name = "TEST";
  async createPayment({ amount, orderId }) {
    return { provider: "TEST", status: "PAID", amount, reference: `test_${orderId}` };
  }
  async verifyPayment() {
    return { ok: true };
  }
}

export class CodProvider {
  name = "COD";
  async createPayment({ amount, orderId }) {
    return { provider: "COD", status: "PENDING", amount, reference: `cod_${orderId}` };
  }
  async verifyPayment() {
    return { ok: true };
  }
}

export class RazorpayProvider {
  name = "RAZORPAY";
  async createPayment() {
    throw new Error("Razorpay is not configured. Set PAYMENT_PROVIDER=test for development.");
  }
  async verifyPayment() {
    throw new Error("Razorpay is not configured.");
  }
}

export function getPaymentProvider(name = process.env.PAYMENT_PROVIDER || "test") {
  if (name === "cod") return new CodProvider();
  if (name === "razorpay") return new RazorpayProvider();
  return new TestPaymentProvider();
}
