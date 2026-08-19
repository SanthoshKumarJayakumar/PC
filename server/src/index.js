import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createApp } from "./app.js";

const app = createApp();

async function start() {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch (e) {
    console.warn("PostgreSQL unavailable — API will start but data routes will fail:", e.message);
  }
  app.listen(env.port, () => {
    console.log(`Kaelon API http://localhost:${env.port} db=${db}`);
  });
}

start();
