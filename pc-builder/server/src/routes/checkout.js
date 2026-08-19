import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { getPaymentProvider } from '../services/payment/index.js';
import { validateCompatibility } from '../services/compatibility.js';
import { getCart, summarize } from './cart.js';
import { env } from '../config/env.js';

const r = Router();
r.use(requireAuth, requireCsrf);

function orderNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `AF-${n.slice(-8)}`;
}

r.post(
  '/',
  body('fullName').trim().isLength({ min: 2 }),
  body('phone').matches(/^[6-9]\d{9}$/),
  body('line1').trim().isLength({ min: 4 }),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').matches(/^\d{6}$/),
  body('method').isIn(['TEST', 'COD']),
  validate,
  asyncHandler(async (req, res) => {
    const cart = summarize(await getCart(req.user.id));
    const active = cart.items.filter((i) => !i.savedForLater);
    if (!active.length) throw new HttpError(400, 'Your cart is empty.');

    for (const item of active) {
      if (item.configuration) {
        const parts = item.configuration.parts.map((p) => ({
          ...p.component,
          quantity: p.quantity,
        }));
        const compat = validateCompatibility(parts);
        if (!compat.valid) {
          throw new HttpError(
            400,
            `Build "${item.configuration.name}" failed compatibility checks and cannot be checked out.`,
            compat.errors
          );
        }
      }
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName: req.body.fullName,
        phone: req.body.phone,
        line1: req.body.line1,
        line2: req.body.line2 || null,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        isDefault: true,
      },
    });

    const method = req.body.method;
    const initialStatus = method === 'COD' ? 'CONFIRMED' : 'PENDING_PAYMENT';

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: req.user.id,
          addressId: address.id,
          status: initialStatus,
          subtotal: cart.pricing.subtotal,
          gstAmount: cart.pricing.gstAmount,
          discountAmount: cart.pricing.discount,
          deliveryFee: cart.pricing.deliveryFee,
          total: cart.pricing.total,
          couponId: cart.couponId,
          notes: req.body.notes || null,
          items: {
            create: active.map((item) => ({
              kind: item.kind,
              productId: item.productId,
              configurationId: item.configurationId,
              name: item.product?.name || item.configuration?.name,
              quantity: item.quantity,
              unitPrice: item.product
                ? item.product.basePrice
                : item.configuration.total,
              snapshot: item.product || item.configuration,
            })),
          },
          history: { create: { status: initialStatus, note: 'Order placed' } },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id, savedForLater: false },
      });

      return created;
    });

    const providerKey = method === 'COD' ? 'cod' : env.paymentProvider;
    const provider = getPaymentProvider(providerKey);
    const session = await provider.createPayment({
      orderId: order.id,
      amount: Number(order.total),
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        method,
        status: session.status === 'AUTHORIZED' ? 'AUTHORIZED' : 'PENDING',
        amount: order.total,
        providerRef: session.paymentId,
        metadata: session,
      },
    });

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, payments: true, address: true, history: true },
    });

    res.status(201).json({ order: full, payment: session });
  })
);

r.post(
  '/:id/verify',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { payments: true },
    });
    if (!order) throw new HttpError(404, 'Order not found.');
    const payment = order.payments[0];
    const provider = getPaymentProvider(payment.provider);
    const result = await provider.verifyPayment({
      paymentId: payment.providerRef,
      payload: req.body,
    });
    const status =
      result.status === 'CAPTURED' || result.status === 'AUTHORIZED' ? 'PAID' : 'PENDING_PAYMENT';
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: result.status },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: status === 'PAID' ? 'CONFIRMED' : order.status },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: status === 'PAID' ? 'CONFIRMED' : order.status, note: 'Payment updated' },
      }),
    ]);
    res.json({ ok: true, status: result.status });
  })
);

export default r;
