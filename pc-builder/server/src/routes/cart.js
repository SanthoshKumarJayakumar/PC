import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { priceBreakdown } from '../lib/pricing.js';
import { validateCompatibility } from '../services/compatibility.js';

const r = Router();
r.use(requireAuth);

async function getCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      coupon: true,
      items: {
        include: {
          product: { include: { images: { take: 1 } } },
          configuration: {
            include: { parts: { include: { component: { include: { category: true } } } } },
          },
        },
      },
    },
  });
}

function summarize(cart) {
  let subtotal = 0;
  for (const item of cart.items.filter((i) => !i.savedForLater)) {
    if (item.product) subtotal += Number(item.product.basePrice) * item.quantity;
    if (item.configuration) subtotal += Number(item.configuration.total) * item.quantity;
  }
  return {
    ...cart,
    pricing: priceBreakdown(subtotal, {
      discount: cart.coupon
        ? cart.coupon.percentOff
          ? (subtotal * cart.coupon.percentOff) / 100
          : Number(cart.coupon.amountOff || 0)
        : 0,
    }),
  };
}

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user.id);
    res.json({ cart: summarize(cart) });
  })
);

r.post(
  '/items',
  requireCsrf,
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user.id);
    const { productId, configurationId, quantity = 1 } = req.body;
    if (!productId && !configurationId) throw new HttpError(400, 'Add a product or a saved build.');
    if (configurationId) {
      const config = await prisma.configuration.findFirst({
        where: { id: configurationId, userId: req.user.id },
        include: { parts: { include: { component: { include: { category: true } } } } },
      });
      if (!config) throw new HttpError(404, 'Build not found.');
      const compat = validateCompatibility(
        config.parts.map((p) => ({ ...p.component, quantity: p.quantity }))
      );
      if (!compat.valid) {
        throw new HttpError(400, 'This build is not compatible and cannot be added to cart.', compat.errors);
      }
    }
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        kind: productId ? 'PRODUCT' : 'CONFIGURATION',
        productId: productId || null,
        configurationId: configurationId || null,
        quantity: Number(quantity) || 1,
      },
    });
    const next = await getCart(req.user.id);
    res.status(201).json({ cart: summarize(next) });
  })
);

r.patch(
  '/items/:id',
  requireCsrf,
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user.id);
    const item = cart.items.find((i) => i.id === req.params.id);
    if (!item) throw new HttpError(404, 'Cart item not found.');
    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: req.body.quantity != null ? Number(req.body.quantity) : item.quantity,
        savedForLater: req.body.savedForLater ?? item.savedForLater,
      },
    });
    res.json({ cart: summarize(await getCart(req.user.id)) });
  })
);

r.delete(
  '/items/:id',
  requireCsrf,
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user.id);
    await prisma.cartItem.deleteMany({ where: { id: req.params.id, cartId: cart.id } });
    res.json({ cart: summarize(await getCart(req.user.id)) });
  })
);

r.post(
  '/coupon',
  requireCsrf,
  asyncHandler(async (req, res) => {
    const code = String(req.body.code || '').toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) throw new HttpError(400, 'Coupon is not valid.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new HttpError(400, 'Coupon expired.');
    await prisma.cart.update({ where: { userId: req.user.id }, data: { couponId: coupon.id } });
    res.json({ cart: summarize(await getCart(req.user.id)) });
  })
);

export { getCart, summarize };
export default r;
