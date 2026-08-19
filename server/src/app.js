import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { componentRouter } from "./routes/components.js";
import { configRouter } from "./routes/configurations.js";
import { cartRouter } from "./routes/cart.js";
import { orderRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter, supportRouter } from "./routes/public.js";
import { errorHandler, notFound } from "./middleware/error.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true });
  app.use("/api/auth/login", authLimit);
  app.use("/api/auth/register", authLimit);

  app.use("/api", publicRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/components", componentRouter);
  app.use("/api/configurations", configRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/support", supportRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
