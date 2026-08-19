import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const r = Router();

function productCard(p) {
  const stock = p.inventory?.reduce((s, i) => s + i.quantity - i.reserved, 0) ?? null;
  const rating =
    p.reviews?.length
      ? p.reviews.reduce((s, rv) => s + rv.rating, 0) / p.reviews.length
      : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    kind: p.kind,
    tier: p.tier,
    purpose: p.purpose,
    basePrice: Number(p.basePrice),
    category: p.category,
    thumbnail: p.images?.[0] || null,
    stock,
    rating,
    reviewCount: p.reviews?.length || 0,
  };
}

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      q,
      category,
      kind = 'PREBUILD',
      minPrice,
      maxPrice,
      cpu,
      gpu,
      ram,
      storage,
      sort = 'featured',
      page = 1,
      limit = 12,
    } = req.query;

    const where = { isPublished: true, kind };
    if (category) where.category = { slug: String(category) };
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = Number(minPrice);
      if (maxPrice) where.basePrice.lte = Number(maxPrice);
    }
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } },
        { purpose: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const componentFilters = [];
    if (cpu) componentFilters.push({ component: { brand: { contains: String(cpu), mode: 'insensitive' } } });
    if (gpu) {
      componentFilters.push({
        component: {
          OR: [
            { name: { contains: String(gpu), mode: 'insensitive' } },
            { brand: { contains: String(gpu), mode: 'insensitive' } },
          ],
        },
      });
    }
    if (ram) componentFilters.push({ component: { name: { contains: String(ram), mode: 'insensitive' } } });
    if (storage) {
      componentFilters.push({ component: { name: { contains: String(storage), mode: 'insensitive' } } });
    }
    if (componentFilters.length) where.components = { some: { OR: componentFilters } };

    const orderBy =
      sort === 'price_asc'
        ? { basePrice: 'asc' }
        : sort === 'price_desc'
          ? { basePrice: 'desc' }
          : sort === 'newest'
            ? { createdAt: 'desc' }
            : { name: 'asc' };

    const take = Math.min(48, Number(limit) || 12);
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 }, reviews: true, inventory: true },
        orderBy,
        take,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: items.map(productCard),
      page: Number(page) || 1,
      limit: take,
      total,
      pages: Math.ceil(total / take),
    });
  })
);

r.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
    res.json({ categories });
  })
);

r.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        components: { include: { component: { include: { category: true } } } },
        reviews: {
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
        },
        inventory: true,
      },
    });
    if (!product || !product.isPublished) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const related = await prisma.product.findMany({
      where: { isPublished: true, kind: product.kind, id: { not: product.id } },
      include: { images: { take: 1 }, category: true, reviews: true, inventory: true },
      take: 6,
    });
    res.json({
      product: {
        ...product,
        basePrice: Number(product.basePrice),
        stock: product.inventory.reduce((s, i) => s + i.quantity - i.reserved, 0),
      },
      related: related.map(productCard),
    });
  })
);

r.post(
  '/:slug/reviews',
  requireAuth,
  requireCsrf,
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').trim().isLength({ min: 2, max: 120 }),
  body('body').trim().isLength({ min: 8, max: 2000 }),
  validate,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      create: {
        userId: req.user.id,
        productId: product.id,
        rating: req.body.rating,
        title: req.body.title,
        body: req.body.body,
      },
      update: { rating: req.body.rating, title: req.body.title, body: req.body.body },
    });
    res.status(201).json({ review });
  })
);

export default r;
