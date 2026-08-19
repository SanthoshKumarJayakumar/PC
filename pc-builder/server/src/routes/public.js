import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';

const r = Router();

r.get(
  '/faq',
  asyncHandler(async (_req, res) => {
    const items = await prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ items });
  })
);

r.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const items = await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items });
  })
);

r.post(
  '/leads',
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('location').trim().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobile: req.body.mobile,
        location: req.body.location,
        source: req.body.source || 'site',
      },
    });
    res.status(201).json({ ok: true, id: lead.id });
  })
);

r.get(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        mobile: req.user.mobile,
        role: req.user.role?.name,
        profile: req.user.profile,
      },
      addresses,
      notifications,
    });
  })
);

r.patch(
  '/profile',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const profile = await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: {
        firstName: req.body.firstName ?? req.user.profile.firstName,
        lastName: req.body.lastName ?? req.user.profile.lastName,
        location: req.body.location ?? req.user.profile.location,
      },
    });
    res.json({ profile });
  })
);

r.get(
  '/wishlist',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { images: { take: 1 } } } },
    });
    res.json({ items });
  })
);

r.post(
  '/wishlist',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: req.body.productId } },
      create: { userId: req.user.id, productId: req.body.productId },
      update: {},
    });
    res.status(201).json({ item });
  })
);

r.get(
  '/sitemap-urls',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isPublished: true },
      select: { slug: true, kind: true, updatedAt: true },
    });
    res.json({ products });
  })
);

export default r;
