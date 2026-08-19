import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { fail } from "../lib/http.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.kaelon_access;
    if (!token) return fail(res, "UNAUTHENTICATED", "Sign in required.", 401);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) return fail(res, "UNAUTHENTICATED", "Account unavailable.", 401);
    req.user = user;
    next();
  } catch {
    return fail(res, "UNAUTHENTICATED", "Session expired.", 401);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, "UNAUTHENTICATED", "Sign in required.", 401);
    if (!roles.includes(req.user.role)) return fail(res, "FORBIDDEN", "Insufficient permissions.", 403);
    next();
  };
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.kaelon_access;
    if (token) {
      const payload = jwt.verify(token, env.jwtSecret);
      req.user = await prisma.user.findUnique({ where: { id: payload.sub } });
    }
  } catch {
    req.user = null;
  }
  next();
}
