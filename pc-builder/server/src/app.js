import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import componentRoutes from './routes/components.js';
import configRoutes from './routes/configurations.js';
import cartRoutes from './routes/cart.js';
import checkoutRoutes from './routes/checkout.js';
import orderRoutes from './routes/orders.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import { prisma } from './lib/prisma.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.isProd ? 300 : 2000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 15 }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
  app.use(attachUser);

  app.get('/api/health', async (_req, res) => {
    let db = 'unknown';
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    res.json({ ok: true, service: 'aetherforge-api', db, time: new Date().toISOString() });
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${env.clientUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', async (_req, res) => {
    const staticPaths = [
      '/',
      '/about',
      '/prebuild',
      '/configure',
      '/gallery',
      '/contact-us',
      '/faq',
      '/refund-policy',
      '/privacy-policy',
      '/terms-of-service',
    ];
    let products = [];
    try {
      products = await prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, kind: true, updatedAt: true },
      });
    } catch {
      products = [];
    }
    const urls = [
      ...staticPaths.map((p) => `${env.clientUrl}${p}`),
      ...products.map((p) => `${env.clientUrl}/${p.kind === 'PREBUILD' ? 'prebuild' : 'prebuild'}/${p.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/components', componentRoutes);
  app.use('/api/configs', configRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
