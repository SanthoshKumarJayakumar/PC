import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
dotenv.config({ path: path.join(root, ".env") });

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const crossSite = !/localhost|127\.0\.0\.1/.test(clientUrl);

export const env = {
  node: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  clientUrl,
  jwtSecret: process.env.JWT_SECRET || "dev-access",
  jwtRefresh: process.env.JWT_REFRESH_SECRET || "dev-refresh",
  accessExp: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExp: process.env.JWT_REFRESH_EXPIRES || "7d",
  cookieSecure: crossSite || process.env.COOKIE_SECURE === "true",
  sameSite: crossSite ? "none" : (process.env.COOKIE_SAMESITE || "lax").toLowerCase(),
  paymentProvider: process.env.PAYMENT_PROVIDER || "test",
  gstRate: Number(process.env.GST_RATE || 0.18),
  deliveryFee: Number(process.env.DELIVERY_FEE || 499),
  freeDeliveryOver: Number(process.env.FREE_DELIVERY_OVER || 50000),
  psuHeadroom: Number(process.env.PSU_HEADROOM || 1.3),
  uploadDir: process.env.UPLOAD_DIR || "server/uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25),
};
