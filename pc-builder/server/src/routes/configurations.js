import { Router } from 'express';
import crypto from 'crypto';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { evaluateSelection } from '../services/buildService.js';

const r = Router();

async function persistConfig(userId, name, selections, status = 'SAVED') {
  const { parts, compatibility, pricing } = await evaluateSelection(selections);
  const config = await prisma.configuration.create({
    data: {
      userId,
      name,
      status,
      shareToken: crypto.randomBytes(8).toString('hex'),
      subtotal: pricing.subtotal,
      gstAmount: pricing.gstAmount,
      total: pricing.total,
      valid: compatibility.valid,
      parts: {
        create: parts.map((p) => ({
          componentId: p.id,
          quantity: p.quantity,
          slot: p.slot || p.category.slug,
        })),
      },
    },
    include: { parts: { include: { component: { include: { category: true } } } } },
  });
  return { config, compatibility, pricing };
}

r.post(
  '/validate',
  body('selections').isArray({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const result = await evaluateSelection(req.body.selections, req.body.couponCode);
    res.json({
      valid: result.compatibility.valid,
      compatibility: result.compatibility,
      pricing: result.pricing,
    });
  })
);

r.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const configs = await prisma.configuration.findMany({
      where: { userId: req.user.id, status: { not: 'ARCHIVED' } },
      include: { parts: { include: { component: { include: { category: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ configs });
  })
);

r.get(
  '/shared/:token',
  asyncHandler(async (req, res) => {
    const config = await prisma.configuration.findUnique({
      where: { shareToken: req.params.token },
      include: { parts: { include: { component: { include: { category: true } } } } },
    });
    if (!config) throw new HttpError(404, 'Build not found.');
    res.json({ config });
  })
);

r.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const config = await prisma.configuration.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { parts: { include: { component: { include: { category: true } } } } },
    });
    if (!config) throw new HttpError(404, 'Build not found.');
    res.json({ config });
  })
);

r.post(
  '/',
  requireAuth,
  requireCsrf,
  body('name').trim().isLength({ min: 1, max: 80 }),
  body('selections').isArray({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const saved = await persistConfig(req.user.id, req.body.name, req.body.selections);
    res.status(201).json(saved);
  })
);

r.patch(
  '/:id',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const existing = await prisma.configuration.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new HttpError(404, 'Build not found.');
    if (req.body.selections) {
      await prisma.configurationComponent.deleteMany({ where: { configurationId: existing.id } });
      const { parts, compatibility, pricing } = await evaluateSelection(req.body.selections);
      const config = await prisma.configuration.update({
        where: { id: existing.id },
        data: {
          name: req.body.name || existing.name,
          subtotal: pricing.subtotal,
          gstAmount: pricing.gstAmount,
          total: pricing.total,
          valid: compatibility.valid,
          parts: {
            create: parts.map((p) => ({
              componentId: p.id,
              quantity: p.quantity,
              slot: p.slot || p.category.slug,
            })),
          },
        },
        include: { parts: { include: { component: { include: { category: true } } } } },
      });
      return res.json({ config, compatibility, pricing });
    }
    const config = await prisma.configuration.update({
      where: { id: existing.id },
      data: { name: req.body.name || existing.name },
    });
    res.json({ config });
  })
);

r.post(
  '/:id/duplicate',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const existing = await prisma.configuration.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { parts: true },
    });
    if (!existing) throw new HttpError(404, 'Build not found.');
    const saved = await persistConfig(
      req.user.id,
      `${existing.name} copy`,
      existing.parts.map((p) => ({ componentId: p.componentId, quantity: p.quantity, slot: p.slot }))
    );
    res.status(201).json(saved);
  })
);

r.delete(
  '/:id',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const existing = await prisma.configuration.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new HttpError(404, 'Build not found.');
    await prisma.configuration.update({
      where: { id: existing.id },
      data: { status: 'ARCHIVED' },
    });
    res.json({ ok: true });
  })
);

export default r;
