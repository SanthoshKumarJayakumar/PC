import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const cookieOpts = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.sameSite,
  path: "/",
};

export function signAccess(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.accessExp });
}

export function signRefresh(user) {
  return jwt.sign({ sub: user.id, typ: "refresh" }, env.jwtRefresh, { expiresIn: env.refreshExp });
}

export function setAuthCookies(res, access, refresh) {
  res.cookie("kaelon_access", access, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("kaelon_refresh", refresh, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res) {
  res.clearCookie("kaelon_access", { ...cookieOpts });
  res.clearCookie("kaelon_refresh", { ...cookieOpts });
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    mobile: user.mobile,
    role: user.role,
  };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function persistRefresh(userId, token) {
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

/** Rotate cookies from a valid refresh token. Returns the user, or null. */
export async function rotateRefreshSession(token, res) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtRefresh);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.active) return null;
    const stored = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    let valid = false;
    for (const row of stored) {
      if (await bcrypt.compare(token, row.tokenHash)) valid = true;
    }
    if (!valid) return null;
    const access = signAccess(user);
    const refresh = signRefresh(user);
    await persistRefresh(user.id, refresh);
    setAuthCookies(res, access, refresh);
    return user;
  } catch {
    return null;
  }
}
