import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env, COOKIE } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http.js';

export function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role?.name || user.roleName, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpires }
  );
}

export function signRefresh(user, jti) {
  return jwt.sign({ sub: user.id, jti }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

export function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.cookieSecure || env.isProd,
    sameSite: env.cookieSameSite,
    domain: env.cookieDomain,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(res, { access, refresh, csrf }) {
  res.cookie(COOKIE.access, access, cookieOptions(15 * 60 * 1000));
  res.cookie(COOKIE.refresh, refresh, cookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie(COOKIE.csrf, csrf, { ...cookieOptions(7 * 24 * 60 * 60 * 1000), httpOnly: false });
}

export function clearAuthCookies(res) {
  const base = cookieOptions(0);
  res.clearCookie(COOKIE.access, base);
  res.clearCookie(COOKIE.refresh, base);
  res.clearCookie(COOKIE.csrf, { ...base, httpOnly: false });
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function attachUser(req, _res, next) {
  const token = req.cookies?.[COOKIE.access];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, profile: true },
    });
    if (user && user.isActive) req.user = user;
  } catch {
    /* expired access token is handled by /auth/refresh */
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) throw new HttpError(401, 'Please sign in to continue.');
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, 'Please sign in to continue.');
    const name = req.user.role?.name;
    if (!roles.includes(name)) throw new HttpError(403, 'You do not have access to this area.');
    next();
  };
}

export function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const header = req.get('x-csrf-token');
  const cookie = req.cookies?.[COOKIE.csrf];
  if (!cookie || !header || header !== cookie) {
    throw new HttpError(403, 'Invalid CSRF token.');
  }
  next();
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    role: user.role?.name,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          location: user.profile.location,
        }
      : null,
  };
}
