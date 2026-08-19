import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireCsrf, requireRole, publicUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth, requireRole('ADMIN'), requireCsrf);

r.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, orders, openTickets, products, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.product.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    ]);
    const recent = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { profile: true } } },
    });
    res.json({
      users,
      orders,
      openTickets,
      products,
      revenue: Number(revenue._sum.total || 0),
      recent,
    });
  })
);

r.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      include: { category: true, inventory: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  })
);

r.post(
  '/products',
  body('name').trim().notEmpty(),
  body('slug').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('basePrice').isFloat({ min: 0 }),
  validate,
  asyncHandler(async (req, res) => {
    const category = await prisma.productCategory.findFirst({
      where: { slug: req.body.categorySlug || 'gaming' },
    });
    if (!category) throw new HttpError(400, 'Unknown category');
    const product = await prisma.product.create({
      data: {
        slug: req.body.slug,
        name: req.body.name,
        subtitle: req.body.subtitle || null,
        description: req.body.description,
        kind: req.body.kind || 'PREBUILD',
        categoryId: category.id,
        basePrice: req.body.basePrice,
        tier: req.body.tier,
        purpose: req.body.purpose,
        specs: req.body.specs || {},
        faq: req.body.faq || [],
      },
    });
    res.status(201).json({ product });
  })
);

r.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        description: req.body.description,
        basePrice: req.body.basePrice,
        isPublished: req.body.isPublished,
        subtitle: req.body.subtitle,
      },
    });
    res.json({ product });
  })
);

r.get(
  '/components',
  asyncHandler(async (_req, res) => {
    const components = await prisma.component.findMany({
      include: { category: true, inventory: true },
      orderBy: { name: 'asc' },
    });
    res.json({ components });
  })
);

r.post(
  '/components',
  body('name').trim().notEmpty(),
  body('sku').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('categorySlug').trim().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const category = await prisma.componentCategory.findUnique({
      where: { slug: req.body.categorySlug },
    });
    if (!category) throw new HttpError(400, 'Unknown component category');
    const component = await prisma.component.create({
      data: {
        slug: req.body.slug || req.body.sku.toLowerCase(),
        name: req.body.name,
        brand: req.body.brand,
        sku: req.body.sku,
        price: req.body.price,
        description: req.body.description || '',
        specs: req.body.specs || {},
        wattageEst: req.body.wattageEst || 0,
        categoryId: category.id,
      },
    });
    res.status(201).json({ component });
  })
);

r.patch(
  '/components/:id',
  asyncHandler(async (req, res) => {
    const component = await prisma.component.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        price: req.body.price,
        specs: req.body.specs,
        isActive: req.body.isActive,
        description: req.body.description,
        wattageEst: req.body.wattageEst,
      },
    });
    res.json({ component });
  })
);

r.get(
  '/compatibility',
  asyncHandler(async (_req, res) => {
    const rules = await prisma.componentCompatibility.findMany({
      include: { from: true, to: true },
      take: 500,
    });
    res.json({ rules });
  })
);

r.post(
  '/compatibility',
  body('fromId').isUUID(),
  body('toId').isUUID(),
  body('ruleKey').trim().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const rule = await prisma.componentCompatibility.create({
      data: {
        fromId: req.body.fromId,
        toId: req.body.toId,
        ruleKey: req.body.ruleKey,
        compatible: req.body.compatible !== false,
        notes: req.body.notes,
      },
    });
    res.status(201).json({ rule });
  })
);

r.post(
  '/inventory',
  body('quantity').isInt(),
  validate,
  asyncHandler(async (req, res) => {
    const row = await prisma.inventory.create({
      data: {
        productId: req.body.productId || null,
        componentId: req.body.componentId || null,
        quantity: req.body.quantity,
        reason: req.body.reason || 'ADJUSTMENT',
        note: req.body.note,
      },
    });
    res.status(201).json({ inventory: row });
  })
);

r.get(
  '/orders',
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: { user: { include: { profile: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ orders });
  })
);

r.patch(
  '/orders/:id',
  body('status').isString(),
  validate,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        history: { create: { status: req.body.status, note: req.body.note || 'Status updated' } },
      },
      include: { history: true },
    });
    res.json({ order });
  })
);

r.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { role: true, profile: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ users: users.map((u) => ({ ...publicUser(u), isActive: u.isActive, createdAt: u.createdAt })) });
  })
);

r.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const data = {};
    if (typeof req.body.isActive === 'boolean') data.isActive = req.body.isActive;
    if (req.body.role) {
      const role = await prisma.role.findUnique({ where: { name: req.body.role } });
      if (role) data.roleId = role.id;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { role: true, profile: true },
    });
    res.json({ user: publicUser(user) });
  })
);

r.get(
  '/support',
  asyncHandler(async (_req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      include: { user: { include: { profile: true } }, messages: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ tickets });
  })
);

r.post(
  '/support/:id/reply',
  body('body').trim().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status || 'IN_PROGRESS',
        assigneeId: req.user.id,
        messages: { create: { userId: req.user.id, body: req.body.body } },
      },
      include: { messages: true },
    });
    res.json({ ticket });
  })
);

export default r;
