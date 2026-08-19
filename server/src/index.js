import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createApp } from "./app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const app = createApp();

async function start() {
  try {
    execSync("npx prisma migrate deploy", { cwd: root, stdio: "inherit", env: process.env });
  } catch (e) {
    console.warn("prisma migrate deploy failed:", e.message);
  }

  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch (e) {
    console.warn("PostgreSQL unavailable — API will start but data routes will fail:", e.message);
  }
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Kaelon API listening on ${env.port} db=${db}`);
  });
}

start();
