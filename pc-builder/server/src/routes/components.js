import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { evaluateSelection } from '../services/buildService.js';
import { validateCompatibility, normalizeParts } from '../services/compatibility.js';

const r = Router();

r.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.componentCategory.findMany({ orderBy: { stepOrder: 'asc' } });
    res.json({ categories });
  })
);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, q, brand } = req.query;
    const where = { isActive: true };
    if (category) where.category = { slug: String(category) };
    if (brand) where.brand = { contains: String(brand), mode: 'insensitive' };
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { brand: { contains: String(q), mode: 'insensitive' } },
        { sku: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const items = await prisma.component.findMany({
      where,
      include: { category: true, inventory: true },
      orderBy: { price: 'asc' },
    });
    res.json({
      items: items.map((c) => ({
        ...c,
        price: Number(c.price),
        stock: c.inventory.reduce((s, i) => s + i.quantity - i.reserved, 0),
      })),
    });
  })
);

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
      parts: result.parts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category.slug,
        price: Number(p.price),
        quantity: p.quantity,
      })),
    });
  })
);

r.post(
  '/validate-local',
  asyncHandler(async (req, res) => {
    const parts = normalizeParts(req.body.parts || []);
    res.json(validateCompatibility(parts));
  })
);

export default r;
