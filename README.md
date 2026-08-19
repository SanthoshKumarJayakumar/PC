# Kaelon

Premium 3D custom-PC configurator and e-commerce platform.

> See the machine before you own it.

Choose a component → the PC updates in 3D → compatibility, wattage, and GST pricing recalculate on the server → save, share, checkout.

This is a real stack: **Vite/React → Express REST → Prisma → PostgreSQL**. Prices, stock, roles, and compatibility are never trusted from the browser.

NukePC was used only as workflow inspiration. Branding, copy, SKUs, and 3D assets are original.

## Architecture

```text
Frontend (Vite + React + R3F)
   ↓  REST /api  cookies
Backend (Express)
   ↓
Prisma ORM
   ↓
PostgreSQL
```

- **Build state:** Zustand (`client/src/store/buildStore.js`)
- **Catalog/cart/orders:** TanStack Query
- **3D:** React Three Fiber. Parts are independent nodes. Transforms come from `Component3DModel` in the database.
- **Placeholders:** procedural PBR meshes until production GLBs are attached (admin can set `modelUrl`)

## Stack

- Client: React 19, Vite, React Router, Three.js, R3F, Drei, Zustand, TanStack Query
- Server: Node, Express, JWT HTTP-only cookies, bcrypt, Helmet, CORS, rate limiting, express-validator
- Data: PostgreSQL 17 + Prisma
- Payments: `TestPaymentProvider` / `CodProvider` (`PAYMENT_PROVIDER=test`). Razorpay stubbed.

## Prerequisites

- Node 20+
- PostgreSQL 17 (Docker optional — `docker-compose.yml` maps **55432**)

This Windows workspace does not require Docker. A project-local cluster can live in `.pgdata` (gitignored) on port **55432**.

## Environment

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auth |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Seeded customer |
| `GST_RATE` / `DELIVERY_FEE` / `PSU_HEADROOM` | Pricing & power |
| `PAYMENT_PROVIDER` | `test` \| `cod` \| `razorpay` |

## PostgreSQL

### Docker

```powershell
docker compose up -d
```

### Local cluster (Windows, no Docker)

```powershell
& "C:\Program Files\PostgreSQL\17\bin\initdb.exe" -D "d:\Website\PC Build\.pgdata" -U kaelon -A trust -E UTF8 --no-locale
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D "d:\Website\PC Build\.pgdata" -o "-p 55432" -l "d:\Website\PC Build\.pgdata\kaelon.log" start
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -p 55432 -U kaelon kaelon
```

After reboot, start the cluster again with `pg_ctl ... start`.

## Install, migrate, seed

```powershell
cd "d:\Website\PC Build"
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

Seed includes compatible gaming/creator kits **and** intentional mismatches (AG8 CPU vs HX5 board, DDR4 vs DDR5, 336mm GPU vs 250mm case, 650W PSU vs 750W GPU requirement).

## Development

```powershell
npm run dev
```

- Client: http://localhost:5173
- API health: http://localhost:4000/api/health

Sign in with the admin/demo emails from `.env`.

## Tests

```powershell
npm test
```

Backend: compatibility, power, GST, auth guards, health envelope.  
Frontend: Zustand initial build state.

## 3D asset conventions

- Units: **meters**, Y-up, forward −Z
- Origin: logical **mount point**
- Scale 1:1 where practical
- `modelUrl` null → category placeholder mesh
- Replacement must not remount the Canvas; only the slot node changes
- Dispose geometries/materials when swapping GLBs
- Mobile: capped pixel ratio, no extra post-processing

Admin: `/admin/models` to edit position/rotation/scale and optional GLB URL.

## Production

- Frontend: Vercel / any static host (`npm run build -w client`)
- Backend: Render / Railway / ECS (`node server/src/index.js`)
- Set `CLIENT_URL`, `COOKIE_SECURE=true`, strong JWT secrets, managed Postgres
- `npx prisma migrate deploy && npm run db:seed` (seed only on empty DBs)

## Troubleshooting

| Symptom | Fix |
|---|---|
| `db: down` | Start Postgres on 55432; check `DATABASE_URL` |
| Auth loops | Ensure Vite proxy `/api` and cookies `sameSite=lax` |
| Blank 3D | WebGL disabled — lists still work |
| Invalid config at checkout | Server re-validates; fix highlighted slot |
