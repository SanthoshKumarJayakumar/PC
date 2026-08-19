import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../lib/http.js';
import { requireAuth, requireCsrf, publicUser } from '../middleware/auth.js';
import * as auth from '../services/authService.js';

const r = Router();

const registerRules = [
  body('firstName').trim().isLength({ min: 1, max: 80 }),
  body('lastName').trim().isLength({ min: 1, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((v, { req }) => v === req.body.password),
];

r.post(
  '/register',
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const user = await auth.register(req.body);
    const session = await auth.issueSession(res, user);
    res.status(201).json(session);
  })
);

r.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const user = await auth.login(req.body);
    const session = await auth.issueSession(res, user);
    res.json(session);
  })
);

r.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const session = await auth.rotateRefresh(req, res);
    res.json(session);
  })
);

r.post(
  '/logout',
  requireCsrf,
  asyncHandler(async (req, res) => {
    await auth.logout(req, res);
    res.json({ ok: true });
  })
);

r.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

r.post(
  '/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  asyncHandler(async (req, res) => {
    await auth.requestPasswordReset(req.body.email);
    res.json({ ok: true, message: 'If an account exists, reset instructions were sent.' });
  })
);

r.post(
  '/reset-password',
  body('token').isString().isLength({ min: 16 }),
  body('password').isLength({ min: 8 }),
  validate,
  asyncHandler(async (req, res) => {
    await auth.resetPassword(req.body.token, req.body.password);
    res.json({ ok: true });
  })
);

export default r;
