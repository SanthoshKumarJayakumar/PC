import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  hashPassword,
  verifyPassword,
  signAccess,
  signRefresh,
  setAuthCookies,
  clearAuthCookies,
  publicUser,
  persistRefresh,
  rotateRefreshSession,
} from "../services/authService.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  body("firstName").trim().isLength({ min: 1 }),
  body("lastName").trim().isLength({ min: 1 }),
  body("email").isEmail().normalizeEmail(),
  body("mobile").optional().isString(),
  body("password").isLength({ min: 8 }),
  body("confirmPassword").custom((v, { req }) => v === req.body.password),
  validate,
  async (req, res, next) => {
    try {
      const exists = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (exists) return fail(res, "EMAIL_TAKEN", "Email already registered.", 409);
      const user = await prisma.user.create({
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          mobile: req.body.mobile || null,
          passwordHash: await hashPassword(req.body.password),
        },
      });
      const access = signAccess(user);
      const refresh = signRefresh(user);
      await persistRefresh(user.id, refresh);
      setAuthCookies(res, access, refresh);
      return ok(res, { user: publicUser(user) }, 201);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isString(),
  validate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (!user || !user.active) return fail(res, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
      const match = await verifyPassword(req.body.password, user.passwordHash);
      if (!match) return fail(res, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
      const access = signAccess(user);
      const refresh = signRefresh(user);
      await persistRefresh(user.id, refresh);
      setAuthCookies(res, access, refresh);
      return ok(res, { user: publicUser(user) });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    clearAuthCookies(res);
    return ok(res, {});
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", optionalAuth, async (req, res, next) => {
  try {
    let user = req.user?.active ? req.user : null;
    if (!user) user = await rotateRefreshSession(req.cookies?.kaelon_refresh, res);
    return ok(res, { user: user ? publicUser(user) : null });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/refresh", async (req, res) => {
  const user = await rotateRefreshSession(req.cookies?.kaelon_refresh, res);
  if (!user) return fail(res, "UNAUTHENTICATED", "Invalid refresh token.", 401);
  return ok(res, { user: publicUser(user) });
});

authRouter.post("/forgot-password", body("email").isEmail(), validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (user) {
      const raw = nanoid(32);
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash(raw, 10),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      if (env.node !== "production") console.log(`[kaelon] password reset token for ${user.email}: ${raw}`);
    }
    return ok(res, {}, 200, "If the account exists, a reset link was issued.");
  } catch (e) {
    next(e);
  }
});
