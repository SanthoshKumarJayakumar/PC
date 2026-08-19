# Kaelon

Premium 3D custom-PC configurator and storefront.

> See the machine before you own it.

Pick a part → the glass-side PC updates in 3D → the server checks compatibility, wattage, and GST → save, share, or checkout.

NukePC inspired the **workflow** only. Branding, copy, SKUs, and 3D meshes are original. There are no licensed manufacturer GLBs in this repo; the viewer uses a detailed procedural rig until you attach production models in admin.

## Stack

| Layer | Tech |
| --- | --- |
| Client | Vite, React 19, React Router, Three.js, React Three Fiber, Drei, Zustand, TanStack Query |
| API | Node, Express, JWT HTTP-only cookies, bcrypt, Helmet, CORS, rate limit |
| Data | PostgreSQL + Prisma |
| Payments | `test` / `COD` now; Razorpay stubbed via `PAYMENT_PROVIDER` |

```text
React + Vite  →  REST /api  →  Express  →  Prisma  →  PostgreSQL
```

Prices, stock, roles, and compatibility are **never** trusted from the browser.

## Repository

```text
client/          Vite storefront + 3D builder
server/          Express API
prisma/          schema, migrations, seed
.env.example     required environment keys
docker-compose.yml   Postgres 17 on port 55432
```

## Routes

Public: `/` `/builder` `/prebuilt` `/components` `/gallery` `/about` `/faq` `/contact` `/build/:shareId` `/login` `/register`  
Account: `/cart` `/checkout` `/dashboard/*` `/order/:id`  
Admin: `/admin` `/admin/components` `/admin/models` `/admin/orders` …

## Quick start

```bash
git clone https://github.com/mrrokesh/PC-Build.git
cd PC-Build
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` (database URL, JWT secrets, `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Never commit `.env`.

### Database

**Docker**

```bash
docker compose up -d
```

**Windows without Docker** (PostgreSQL 17 installed):

```powershell
& "C:\Program Files\PostgreSQL\17\bin\initdb.exe" -D ".\.pgdata" -U kaelon -A trust -E UTF8 --no-locale
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D ".\.pgdata" -o "-p 55432" -l ".\.pgdata\kaelon.log" start
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -p 55432 -U kaelon kaelon
```

`DATABASE_URL` in `.env.example` already points at `localhost:55432`.

### Install and run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

- Site: http://localhost:5173  
- API: http://localhost:4000/api/health (`db` should be `up`)

Sign in with the admin/demo emails you set in `.env`.

### Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Client + API |
| `npm test` | Server + client Vitest |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Catalogue + admin/demo users |
| `npm run build` | Production build |

Seed data includes matching kits **and** known mismatches (wrong socket, DDR4 on DDR5, GPU too long for a compact case, 650W PSU vs a 750W GPU).

## 3D conventions

- Units: metres, Y-up, forward −Z, origin = mount point  
- No `modelUrl` → procedural part for that category (case, GPU, RAM, fans, …)  
- Swapping a component must not remount the whole Canvas  
- Admin: `/admin/models` for position / rotation / scale and optional GLB URL  

## API envelope

Success: `{ "success": true, "data": {}, "message": null }`  
Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

Auth uses HTTP-only cookies (`kaelon_access`, `kaelon_refresh`). Vite proxies `/api` in development.

## Production deploy

**Frontend (Vercel)**

Two valid setups:

1. **Root Directory empty** (recommended) — uses repo-root `vercel.json`, output `client/dist`.
2. **Root Directory = `client`** — uses `client/vercel.json`, output `dist`. Do **not** use `npm run build -w client` in this mode.

The Hobby plan only deploys commits authored by the Vercel project owner on a private repo.

**Connect Vercel (site) to Render (API)**

The browser and the API are on different domains, so both sides must know each other.

1. On **Vercel → Settings → Environment Variables** (Production), set:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | Render origin, e.g. `https://your-service.onrender.com` (no trailing slash) |

   Vite bakes this in at **build** time. After saving, **Redeploy** the frontend.

2. On **Render → Environment**, set:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Render Postgres URL |
   | `CLIENT_URL` | Exact Vercel origin, e.g. `https://your-app.vercel.app` (no trailing slash). Add more with commas if you use a custom domain. |
   | `JWT_SECRET` | long random string (not the example) |
   | `JWT_REFRESH_SECRET` | different long random string |
   | `COOKIE_SECURE` | `true` |
   | `COOKIE_SAMESITE` | `none` (required for cookies across Vercel → Render) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin login |
   | `PORT` | leave unset — Render injects it |

3. Create a **Web Service** (Node), not a Static Site. Root Directory empty. Then:

   | Setting | Value |
   | --- | --- |
   | Build | `npm install && npx prisma generate` |
   | Start | `npx prisma migrate deploy && node server/src/index.js` |

   Seed once on an empty database from the Render shell: `npm run db:seed`

4. Live pair:

   - Site: https://pc-build-delta.vercel.app
   - API: https://pc-build-gcq9.onrender.com/api/health (`db` should be `up`)

   `x-render-routing: no-deploy` means the service URL exists but no successful deploy has run. Fix the commands above and click **Manual Deploy**.

Do not reuse the example JWT secrets. Never commit `.env`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Render OOM / Vite on `:5173` | Start command is `npm run dev`. Set it to `npm start` (API only). Do not run Vite on Render. |
| `db: down` | Postgres not running or `DATABASE_URL` wrong |
| Auth loops | `CLIENT_URL` must match the site origin; cookies `SameSite=Lax` |
| Blank 3D | WebGL blocked — lists and checkout still work |
| Checkout rejected | Server found a compatibility or stock error |

## License

See [LICENSE](./LICENSE). Private project unless the repository owner states otherwise.

