import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http.js';
import { env } from '../config/env.js';
import { sendMail } from '../lib/mailer.js';
import {
  signAccess,
  signRefresh,
  setAuthCookies,
  clearAuthCookies,
  hashToken,
  publicUser,
} from '../middleware/auth.js';

const SALT = 12;

export async function register(data) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email.toLowerCase() }, { mobile: data.mobile }] },
  });
  if (existing) throw new HttpError(409, 'An account with that email or mobile already exists.');

  const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!role) throw new HttpError(500, 'Roles are not seeded.');

  const passwordHash = await bcrypt.hash(data.password, SALT);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      mobile: data.mobile,
      passwordHash,
      roleId: role.id,
      profile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          location: data.location || null,
        },
      },
    },
    include: { role: true, profile: true },
  });
  return user;
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true, profile: true },
  });
  if (!user || !user.isActive) throw new HttpError(401, 'Invalid email or password.');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password.');
  return user;
}

export async function issueSession(res, user) {
  const jti = crypto.randomUUID();
  const refresh = signRefresh(user, jti);
  const access = signAccess(user);
  const csrf = crypto.randomBytes(24).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  setAuthCookies(res, { access, refresh, csrf });
  return { user: publicUser(user), csrf };
}

export async function rotateRefresh(req, res) {
  const token = req.cookies?.af_refresh;
  if (!token) throw new HttpError(401, 'No refresh token.');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.');
  }
  const hash = hashToken(token);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash: hash, revokedAt: null },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'Session expired. Please sign in again.');
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true, profile: true },
  });
  if (!user?.isActive) throw new HttpError(401, 'Account disabled.');
  return issueSession(res, user);
}

export async function logout(req, res) {
  const token = req.cookies?.af_refresh;
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  clearAuthCookies(res);
}

export async function requestPasswordReset(email) {
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return;
    const raw = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${env.clientUrl}/reset-password?token=${raw}`;
    if (!env.smtpHost) {
      console.info('[dev] Password reset link (do not expose in API):', link);
    }
    await sendMail({
      to: user.email,
      subject: 'Reset your AetherForge password',
      text: `Reset your password: ${link}`,
      html: `<p>Reset your password: <a href="${link}">${link}</a></p>`,
    });
  } catch (err) {
    console.error('Password reset skipped:', err.message);
  }
}

export async function resetPassword(token, password) {
  const row = await prisma.passwordReset.findFirst({
    where: { tokenHash: hashToken(token), usedAt: null },
  });
  if (!row || row.expiresAt < new Date()) throw new HttpError(400, 'Reset link is invalid or expired.');
  const passwordHash = await bcrypt.hash(password, SALT);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
