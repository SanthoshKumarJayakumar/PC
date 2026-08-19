import { env } from '../../config/env.js';
import { HttpError } from '../../lib/http.js';

class TestPaymentProvider {
  name = 'test';

  async createPayment({ orderId, amount }) {
    return {
      provider: this.name,
      paymentId: `test_${orderId}`,
      status: 'PENDING',
      clientSecret: `test_secret_${orderId}`,
      amount,
      nextAction: 'confirm',
    };
  }

  async verifyPayment({ paymentId, payload }) {
    if (payload?.fail) {
      return { paymentId, status: 'FAILED', providerRef: paymentId };
    }
    return { paymentId, status: 'CAPTURED', providerRef: paymentId };
  }

  async getStatus({ paymentId }) {
    return { paymentId, status: 'CAPTURED' };
  }
}

class CodProvider {
  name = 'cod';

  async createPayment({ orderId, amount }) {
    return {
      provider: this.name,
      paymentId: `cod_${orderId}`,
      status: 'AUTHORIZED',
      amount,
      nextAction: 'none',
    };
  }

  async verifyPayment({ paymentId }) {
    return { paymentId, status: 'AUTHORIZED', providerRef: paymentId };
  }

  async getStatus({ paymentId }) {
    return { paymentId, status: 'AUTHORIZED' };
  }
}

const providers = {
  test: new TestPaymentProvider(),
  cod: new CodProvider(),
};

export function getPaymentProvider(name = env.paymentProvider) {
  const key = (name || 'test').toLowerCase();
  const provider = providers[key];
  if (!provider) {
    throw new HttpError(400, `Unsupported payment provider: ${key}`);
  }
  return provider;
}

export { TestPaymentProvider, CodProvider };
