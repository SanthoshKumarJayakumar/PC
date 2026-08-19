import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { env } from '../config/env.js';

const uploadRoot = path.resolve(process.cwd(), env.uploadDir, 'tickets');
fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 80);
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, WebP, or PDF files are allowed.'), ok);
  },
});

const r = Router();
r.use(requireAuth);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ tickets });
  })
);

r.post(
  '/',
  requireCsrf,
  upload.single('attachment'),
  body('category').trim().notEmpty(),
  body('subject').trim().isLength({ min: 4, max: 140 }),
  body('body').trim().isLength({ min: 8 }),
  validate,
  asyncHandler(async (req, res) => {
    const count = await prisma.supportTicket.count();
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo: `AF-T${String(count + 1).padStart(5, '0')}`,
        userId: req.user.id,
        category: req.body.category,
        subject: req.body.subject,
        messages: {
          create: {
            userId: req.user.id,
            body: req.body.body,
            attachment: req.file ? `/uploads/tickets/${req.file.filename}` : null,
          },
        },
      },
      include: { messages: true },
    });
    res.status(201).json({ ticket });
  })
);

r.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        messages: { include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new HttpError(404, 'Ticket not found.');
    res.json({ ticket });
  })
);

r.post(
  '/:id/messages',
  requireCsrf,
  upload.single('attachment'),
  body('body').trim().isLength({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!ticket) throw new HttpError(404, 'Ticket not found.');
    const message = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        userId: req.user.id,
        body: req.body.body,
        attachment: req.file ? `/uploads/tickets/${req.file.filename}` : null,
      },
    });
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: ticket.status === 'CLOSED' ? 'OPEN' : ticket.status },
    });
    res.status(201).json({ message });
  })
);

export default r;
