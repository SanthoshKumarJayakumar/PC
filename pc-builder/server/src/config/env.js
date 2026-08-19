import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', '4000')),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: required('JWT_SECRET', 'dev-only-change-me-access'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-only-change-me-refresh'),
  jwtAccessExpires: required('JWT_ACCESS_EXPIRES', '15m'),
  jwtRefreshExpires: required('JWT_REFRESH_EXPIRES', '7d'),
  cookieSecure: required('COOKIE_SECURE', 'false') === 'true',
  cookieSameSite: required('COOKIE_SAMESITE', 'lax'),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'AetherForge <noreply@localhost>',
  paymentProvider: required('PAYMENT_PROVIDER', 'test'),
  uploadDir: required('UPLOAD_DIR', 'uploads'),
  maxUploadMb: Number(required('MAX_UPLOAD_MB', '8')),
  gstRate: Number(required('GST_RATE', '0.18')),
  deliveryFee: Number(required('DELIVERY_FEE', '0')),
  isProd: required('NODE_ENV', 'development') === 'production',
};

export const COOKIE = {
  access: 'af_access',
  refresh: 'af_refresh',
  csrf: 'af_csrf',
};
