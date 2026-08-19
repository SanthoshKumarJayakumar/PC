# AetherForge

Original custom-PC commerce and configuration platform for the Indian market (INR, GST). Frontend talks to a REST API on Express; Express uses Prisma against PostgreSQL. This is not a frontend-only mock.

Public-site research for UX mapping (not cloning) is in [`SITE_ANALYSIS.md`](./SITE_ANALYSIS.md) and [`../SITE_ANALYSIS.md`](../SITE_ANALYSIS.md).

## Brand

**AetherForge** — premium dark storefront, fictional catalogue (Ember Pulse, Nova Drift, Forge Titan, Aurora Quill, Vector Slate). Component brands are original (Northstar / Ember CPUs, Helix / Crimson GPUs, Ion / ForgePlate boards).

## Stack

| Layer | Tech |
|---|---|
| Client | Vite, React 18, JavaScript, React Router, Axios, CSS |
| Server | Node, Express, REST, JWT + refresh in HTTP-only cookies, bcrypt, Helmet, CORS, rate limit, express-validator |
| Data | PostgreSQL + Prisma |
| Payments | `PAYMENT_PROVIDER=test` factory (`TestPaymentProvider`, `CodProvider`) |

## Quick start (Windows PowerShell)

```powershell
cd "d:\Website\PC Build\pc-builder"
copy .env.example .env
copy .env.example server\.env   # Prisma CLI also reads server/.env if present

# Postgres (Docker, or a local server)

docker compose up -d

# If Docker is not installed, this repo can use a project-local Postgres 17 cluster
# on port 55432 (data dir: pc-builder/.pgdata, gitignored). Point DATABASE_URL at
# localhost:55432 and the aetherforge database. Keep secrets in .env only.

npm install
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
cd ..
npm run dev
```

- Client: http://localhost:5173  
- API: http://localhost:4000/api/health  

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` **before** seeding so an admin exists. Optional `DEMO_EMAIL` / `DEMO_PASSWORD` seeds a customer. Never commit `.env`.

If Docker is unavailable, install PostgreSQL locally and point `DATABASE_URL` at it. This workspace’s Windows box already had PostgreSQL services running, but the example `aetherforge` role will not match an existing superuser — create a database/user or edit `DATABASE_URL`. The API still boots if the database is down; data routes will error until Postgres is reachable.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Client + server together |
| `npm run test` | Server Vitest suite |
| `npm run lint` | ESLint both workspaces |
| `npm run db:up` | `docker compose up -d` |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Seed catalogue + optional admin |

## Configuration flow

Steps: CPU → Motherboard → RAM → GPU → Storage → Cabinet → PSU → Cooling → OS → Wi-Fi → Extras → Warranty → Review.

The server `validateCompatibility` engine is the source of truth (also used at cart add and checkout). It checks socket/chipset, DDR type/capacity/slots, GPU length vs cabinet, PSU wattage headroom, cooler socket/height/radiator, M.2/SATA counts, and form factor.

Live price: parts subtotal − coupon + **18% GST** + delivery = total.

## REST API (prefix `/api`)

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/register` | public — first, last, email, mobile, password, confirmPassword |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | refresh cookie |
| POST | `/auth/logout` | CSRF |
| GET | `/auth/me` | session |
| POST | `/auth/forgot-password` | public (reset link logged in dev, never returned in JSON) |
| POST | `/auth/reset-password` | public |
| GET/POST | `/products`, `/products/:slug`, reviews | list public |
| GET | `/components`, POST `/components/validate` | public |
| CRUD | `/configs` | user |
| GET | `/configs/shared/:token` | public |
| GET/POST/PATCH/DELETE | `/cart` | user |
| POST | `/checkout`, `/checkout/:id/verify` | user; **rejects incompatible configs** |
| GET | `/orders`, `/orders/:id` | user |
| GET/POST | `/support` | user |
| GET | `/faq`, `/gallery`, POST `/leads` | public |
| GET | `/admin/stats` and nested CRUD | **ADMIN** + CSRF |

Mutating requests send `x-csrf-token` matching the `af_csrf` cookie (set on login). Access token: `af_access`. Refresh: `af_refresh`.

### Order statuses (9 + payment)

`PENDING_PAYMENT` → `PAID` / `CONFIRMED` → `PARTS_ORDERED` → `ASSEMBLING` → `TESTING` → `READY_TO_SHIP` → `SHIPPED` → `DELIVERED` (or `CANCELLED`).

## Environment

See `.env.example`. Required for production: strong `JWT_SECRET` / `JWT_REFRESH_SECRET`, `DATABASE_URL`, `CLIENT_URL`, `COOKIE_SECURE=true`.

SMTP is optional. Without it, password-reset emails are skipped and the **reset URL is printed on the server console only**.

## Production deploy

**Frontend (Vercel)**  
- Root: `pc-builder/client`  
- Build: `npm run build`  
- Output: `dist`  
- Env: none required if API is absolute via `VITE_API_URL` (today Axios uses `/api` + Vite proxy; for production, set Axios `baseURL` to the API origin or add a Vercel rewrite to the Express host).

**Backend (Render / Railway / AWS)**  
- Root: `pc-builder/server`  
- Start: `node src/index.js`  
- Release: `npx prisma migrate deploy && node prisma/seed.js` (seed only on first deploy)  
- Attach a PostgreSQL addon and set `DATABASE_URL`  
- Set `CLIENT_URL` to the Vercel origin for CORS + cookies (`SameSite=none; Secure` if cross-site)

**Postgres**  
Managed Postgres on Railway/Render/RDS. Enable SSL in the URL if required (`?sslmode=require`).

## Tests

```powershell
cd server
npm test
```

Coverage: compatibility engine, GST pricing, payment providers, Helmet health, auth validation, unauthenticated cart/admin guards. Full Prisma integration tests need a live `DATABASE_URL`.

## Security notes

- Passwords hashed with bcrypt; reset tokens stored as SHA-256 hashes  
- HTTP-only JWT cookies; CSRF double-submit cookie for mutations  
- Helmet, rate limits on `/api` and auth  
- Upload allow-list (jpeg/png/webp/pdf) + size cap  
- Admin RBAC via `RoleName.ADMIN`  
- No secrets in the client bundle
