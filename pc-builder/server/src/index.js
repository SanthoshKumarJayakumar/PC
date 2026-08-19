import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`AetherForge API listening on :${env.port}`);
});

prisma
  .$connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch((err) => {
    console.error('PostgreSQL unavailable — API will start but data routes will fail until DATABASE_URL is reachable.');
    console.error(err.message);
  });

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
