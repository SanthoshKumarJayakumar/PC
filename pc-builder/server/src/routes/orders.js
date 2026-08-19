import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  })
);

r.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: true, payments: true, address: true, history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new HttpError(404, 'Order not found.');
    res.json({ order });
  })
);

export default r;
