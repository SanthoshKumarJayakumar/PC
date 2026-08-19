# Public site analysis (nukepc.in)

**Analyzed:** 19 August 2026  
**Method:** Public HTTP fetches, search indexing, and Apify RAG Web Browser crawls. No login credentials. No proprietary assets copied.  
**Purpose:** Inform an original product (**AetherForge**) with comparable UX quality — not a visual or catalog clone.

This document records **observable public structure only**. Anything behind authentication is marked **UNCERTAIN**.

---

## 1. Stack and hosting clues

| Signal | Observation |
|---|---|
| Framework | Next.js (`x-powered-by`, `/_next/image`, `/_next/static/media`) |
| CDN / edge | Cloudflare (`cf-ray`, CSP, `x-frame-options`) + CloudFront for media (`dbgua8qyiz2n1.cloudfront.net`) |
| Images | Next Image optimizer; product thumbnails on CloudFront `/product/thumbnail/{uuid}.jpeg` |
| Sitemap | `robots.txt` references `https://nukepc.in/sitemap.xml` — **500 Internal Server Error** when fetched |
| robots.txt | `Allow: /`; `Disallow: /private/` for Googlebot; many AI crawlers disallowed; `Content-Signal: search=yes, ai-train=no, use=reference` |
| Support subdomain | `https://support.nukepc.in/` — separate SPA (Vite-style hashed assets) |

---

## 2. Route map

### 2.1 Confirmed public routes

| Route | Status | Notes |
|---|---|---|
| `/` | 200 | Homepage: hero, persona cards, process, exclusive CPU promo, pre-builds, FAQ teaser, lead form |
| `/about` | 200 | Mission, vision, stats, testimonials carousel, founder |
| `/prebuild` | 200 | Catalog of pre-built PCs with starting prices |
| `/prebuild/:slug` | 200 | Product detail. Query: `category`, `ramStorage`, `primaryStorage`, `secondaryStorage`, `case` |
| `/gallery` | 200 | Tabs: Gallery / Wallpapers |
| `/contact-us` | 200 | Phone, address, hours, email |
| `/faq` | 200 | Accordion FAQ |
| `/refund-policy` | 200 | Combined terms + returns/refunds (fetch sometimes timed out) |
| `/privacy-policy` | 200 | DPDPA-oriented privacy notice |
| `/terms-of-service` | 200 | CSR-heavy; content overlapped with loading + lead form in crawler |
| `/accessories` | 200 | Accessory catalog (monitors, chairs, mice, pads, keyboards) |
| `/accessories/:slug` | 200 | Accessory detail. Query: `color` |
| `/quote/:persona` | 200 | Persona configurator. Observed personas: `gaming-streaming`, `content-creation`, `engineering-works`, `data-science`. **Crawler received login wall** |
| `/sign-in` | 200 | Auth screen (CSR; form fields not extracted) |
| `/sign-up` | 200 | Same “Welcome Back” copy as sign-in in crawler output — likely shared auth layout |
| `/#get-quote` | 200 | Homepage hash used by “Build Now” / “Configure Your Build” |

### 2.2 Observed product slugs (prebuild)

| Slug | Marketing name | Query example |
|---|---|---|
| `rtx-gaming-pc` | Gaming X Creator | `?category=PREBUILD&ramStorage=16GB&primaryStorage=240GB&secondaryStorage=undefined&case=BLACK` |
| `basic-productivity-pc` | Entry Productivity PC | `ramStorage=8GB` |
| `daily-productivity-pc` | Daily Productivity PC | `ramStorage=8GB` |
| `red-pill-pc` | Red Pill PC | `ramStorage=8GB` |
| `console-killer-pc` | Console Killer PC | (listed on catalog / related) |

### 2.3 Routes that 404 or failed publicly

| Route | Result |
|---|---|
| `/configure` | **404** — custom flow lives under `/quote/:persona`, not `/configure` |
| `/dashboard` | **404** |
| `/my-config` | **404** (nav copy “My Configurations” exists; exact path unknown) |
| `/forgot-password` | **404** on main domain |
| `/admin` | **404** |
| `/cart` | Fetch **timed out** (existence UNCERTAIN) |
| `/checkout` | Not verified |
| `/sitemap.xml` | **500** |

### 2.4 External / related

| URL | Notes |
|---|---|
| `https://support.nukepc.in/` | Support ticket portal. Phone-number login. “Forgot Password?” link. Dark/light logos. |

---

## 3. Header, nav, footer

### Header (public)

- Sticky-style top bar (inferred from persistent logo + avatar on all crawled pages).
- Logo (white PNG via Next Image) linking to `/`.
- Right-side user avatar (`user-demo-logo.png` on CloudFront) — likely account menu trigger.
- **Exact desktop nav labels not fully dumped by markdown crawlers.** From accessory-page crumbs and search snippets: **Prebuild**, **Accessories**, **About**, **My Configurations**.
- Homepage also surfaces **Build Now** → `/#get-quote` and category tiles → `/quote/{persona}`.

### Footer / global lead capture

Persistent modal/sheet titled **“Fill Out Your Information”**:

| Field | Required (inferred) |
|---|---|
| First Name | yes |
| Last Name | yes |
| Mobile | yes |
| Location | yes |
| Submit | CTA |

Validation rules **UNCERTAIN** (no HTML `required`/pattern extracted).

Contact/address also appears on `/contact-us`. Refund policy page lists `support@nukepc.in` and `+91 90253 80083`.

---

## 4. Homepage sections

1. **Hero** — “Power Your Journey”; PC silhouette/hero image; progress-like `0%` (likely quote-progress teaser); CTA **Build Now**.
2. **Priority consultation upsell** — Rs.299, “100% adjustable in your PC invoice”.
3. **Persona grid (4)** — Gaming/Streaming, Content Creation, Engineering Works, Data Science — each with software/game icon chips; links to `/quote/{slug}`.
4. **What Happens Next** — 5 steps: Configuration Sent → Expert Consulting → Assembly & Testing (48h stress test) → Secure Packaging → Pan India Delivery.
5. **Exclusive SKU promo** — AMD Ryzen 9 9950X3D² Dual Edition; CTA “Configure Your Build” → `/#get-quote`.
6. **Promo banner** — Red Pill PC → product page.
7. **Pre-builds for you** — 4 cards with tier (`entry` / `mid-range`), starting INR, “View More” → `/prebuild`.
8. **How it works** accordion — Customer Persona, Expert Consulting, Assembly & Testing, Secure Packaging, Pan-India Free Delivery. CTA “Build your PC”.
9. **FAQ teaser** — 5 questions + “View More” → `/faq`.
10. **Lead form** — First/Last/Mobile/Location.

**Responsive clues:** duplicate persona blocks (large cards vs compact icon rows) suggest distinct desktop vs mobile layouts. Next Image `w=` variants (256 / 640 / 1080 / 1920 / 3840) imply art-directed breakpoints. Horizontal overflow not verified in a real viewport.

---

## 5. Pre-builds catalog (`/prebuild`)

- Grid of systems with **tier** (`entry`, `mid-range`), **starts at ₹**, product photo.
- Promo tiles (“Just ₹ … Only 2 Left”, “Shop Now”).
- Filters/sort/pagination **not visible** in crawler text — **UNCERTAIN** (may be client-only).
- Cards deep-link with **configuration query params** (RAM, primary SSD, secondary HDD, case color).

---

## 6. Product detail (`/prebuild/:slug`)

Observed UI blocks:

1. Title + marketing subtitle (e.g. “Gaming PC under ₹50K”).
2. Use-case chip (Gaming / Streaming, Others).
3. Processor line; GPU line when discrete GPU present (`N/A` on APU builds).
4. Price **inclusive of GST**, “Free Delivery”.
5. Ratings (`5.0 (1 rating)`), purchase social proof (`10+ purchased`, `5+ purchased`).
6. Stock badge: **Out of Stock** / scarcity (“Only 2 Left”).
7. CTA **Add to Cart** (disabled when OOS).
8. Configurable options (labels only extracted):
   - RAM
   - Primary Storage SSD
   - Secondary Storage HDD
   - Cabinet Colors
9. Warranty: “Free on-site 3 Months”; OEM off-site 3–10 years footnote.
10. **Tech specs** table: Motherboard, RAM, CPU cooler, Storage 1/2, Case, SMPS/PSU.
11. **About this build** prose.
12. **Customer reviews** (verified badge, date, initials avatar).
13. **You may also like** — mix of prebuilds + accessories.

Buy Now / Customize CTAs **not confirmed** in markdown (may exist in CSR).

Accessory detail (`/accessories/:slug?color=`): color swatches, GST-inclusive price, Add To Cart.

---

## 7. Configuration / quote workflow

**Public entry:** persona card or `#get-quote`.  
**Route:** `/quote/:persona`.

Crawler of `/quote/gaming-streaming` returned **login wall** (“Welcome Back! … Log in to access your account and continue building…”).

### Therefore UNCERTAIN (auth-gated)

- Step list (CPU → MB → RAM → … vs guided questionnaire)
- Compatibility engine vs human consultant after submit
- Live price vs quote-after-call
- Save/share config
- Sticky summary / mobile “View Build”

### Publicly advertised post-submit process

1. Configuration sent  
2. Expert calls customer  
3. Assembly + 48-hour test  
4. Multi-layer packaging  
5. Free pan-India delivery  

FAQ: component changes allowed **within 24 hours of confirmation** by informing the team. Terms (refund page): **20% advance** to initiate order; confirmation via website, WhatsApp, SMS, email; company may decline orders.

**AetherForge implementation choice:** full self-serve configurator with server-side compatibility (user spec), because NukePC’s live wizard could not be verified.

---

## 8. Cart, checkout, payments

| Item | Evidence |
|---|---|
| Add to Cart | Product pages |
| Cart page | Timeout / not indexed — **UNCERTAIN** |
| Checkout fields | **UNCERTAIN** |
| GST | Prices “Inclusive of GST” |
| Delivery | “Free Delivery” on product cards |
| EMI | FAQ: credit-card EMI |
| Advance | 20% minimum (terms on refund-policy page) |
| Provider | Not named on public pages — **UNCERTAIN** (do not assume Razorpay) |
| COD | **UNCERTAIN** |

---

## 9. Auth

### Main site (`/sign-in`, `/sign-up`)

Crawlers only extracted heading copy. **Form fields, OTP vs password, social login, validation: UNCERTAIN.**  
`/sign-up` and `/sign-in` rendered the same “Welcome Back / Log in” copy — possible shared component or redirect.

### Support portal (`support.nukepc.in`)

| Field / control | Observed |
|---|---|
| Phone Number | Required to continue |
| Continue | Primary CTA |
| Forgot Password? | Link present |
| Theme | Light + dark logos |

Password reset **on main domain `/forgot-password` is 404**. Reset may live only on support subdomain or as a modal — **UNCERTAIN**.

---

## 10. Account areas (dashboard, my config, orders, support)

| Area | Public evidence | Status |
|---|---|---|
| My Configurations | Nav label on accessory crumbs | Path **UNCERTAIN**; `/my-config` 404 |
| Dashboard | `/dashboard` 404 | **UNCERTAIN** |
| My Orders | FAQ mentions order tracking | Route **UNCERTAIN** |
| Support tickets | FAQ: “submit a ticket on our website”; separate `support.nukepc.in` | Logged-in UI **UNCERTAIN** |
| Admin | `/admin` 404 | **UNCERTAIN** (expected) |

---

## 11. Gallery, about, FAQ, contact, policies

### Gallery `/gallery`

- Heading “NukePC Gallery”
- Tabs: **Gallery** | **Wallpapers**
- Media not extracted as a list (likely image grid CSR)

### About `/about`

- Mission / vision (duplicated in crawler — possible animation clones)
- Stats: 7000+ PCs, expert consultation, 3+1 packaging, pan-India free delivery, Chennai free setup, 3 months onsite warranty, dedicated support, hardware warranty claims
- Testimonials (creators / servers) — **do not copy names/builds into AetherForge**
- Founder: Nandha Kumar A, CEO

### Contact `/contact-us`

- Call: 90253 80083
- Support vs bulk/press split
- Address: Nuke Technologies Private Limited, Alapakkam, Maduravoyal, Chennai 600095
- Email: support@nukepc.in
- Hours: 9:00 AM – 6:30 PM daily

### FAQ `/faq`

Themes: config changes, delivery SLA, no game/OS preinstall, custom vs prebuilt, reporting issues, own components, upgrades only for their PCs, no laptops, India-only, sub-₹30k entry, EMI, photos of assembled PC, damaged shipment video, RMA 15–20 days, cleaning, shutdowns, earthing shocks, no display, onsite TN metros, warranty terms, BSOD.

### Refund / terms

- No returns after delivery; warranty starts at e-invoice
- Wrong-item / mismatch: on-site or return shipping paid by seller
- Refunds within **24 hours of initial payment**, valid reason, 7–14 business days
- 20% booking amount; non-refundable after 24h

### Privacy

DPDPA 2023; contact, specs, transactions, cookies for login only; rights of access/correction/erasure/nominate/withdraw; not for under-18.

---

## 12. Responsive behavior (from HTML/CSS clues only)

| Clue | Inference |
|---|---|
| Duplicate persona sections | Desktop feature cards vs compact mobile icon row |
| Next Image widths 256–3840 | Responsive `srcset` |
| Sticky logo + avatar | Compact mobile header |
| Product option groups | Stacked on small screens (typical; not verified) |
| Support portal dark/light logos | Theme toggle |
| Horizontal overflow | **Not verified** in a device lab |

Breakpoints **not extracted** from CSS files. Treat 320 / 768 / 1024 / 1440 / 1920 as implementation targets for AetherForge.

---

## 13. Visible forms and validation

| Form | Fields | Validation observed |
|---|---|---|
| Global lead | First, Last, Mobile, Location | **UNCERTAIN** |
| Contact | Phone/email listed; dedicated form fields **not clearly extracted** | **UNCERTAIN** |
| Sign-in / sign-up | CSR | **UNCERTAIN** |
| Support login | Phone | Continue button |
| Product options | RAM, SSD, HDD, case color | Query-string driven |
| Add to cart | Implicit | OOS disables purchase |

---

## 14. Component map (inferred for a comparable original app)

```
AppShell
├── Header (logo, nav, account, cart)
├── LeadCapture (first, last, mobile, location)
├── Footer (policies, contact)
├── Home
│   ├── Hero
│   ├── PersonaGrid
│   ├── ProcessTimeline
│   ├── ExclusivePromo
│   ├── PrebuildCarousel
│   ├── HowItWorks
│   └── FaqTeaser
├── PrebuildCatalog / ProductDetail
├── AccessoryCatalog / AccessoryDetail
├── QuoteWizard (auth-gated on source site)
├── AuthScreens
├── Gallery
├── About / FAQ / Contact / Policies
└── Account* / Admin*  [source: UNCERTAIN]
```

---

## 15. Database entities (inferred + required for AetherForge)

Inferred from public UI:

- Users / sessions (cookies mentioned in privacy)
- Leads (name, mobile, location)
- Products (prebuild + accessories), categories, images, inventory/stock
- Product option groups (RAM, storage, color) and SKU variants
- Product components (BOM / tech specs)
- Reviews
- Related products
- Quotes / configurations (auth-gated)
- Cart / orders / payments (Add to Cart + GST + delivery)
- Support tickets (FAQ + subdomain)
- CMS-ish FAQs, gallery assets, testimonials

**AetherForge will implement the full normalized set specified in the product brief** (users, roles, profiles, products, components, compatibility, carts, orders, payments, tickets, reviews, wishlist, coupons, inventory, notifications, etc.).

---

## 16. API requirements (for AetherForge, derived from flows)

| Area | Needs |
|---|---|
| Catalog | List/filter/sort/paginate prebuilds; product by slug; related; reviews |
| Components | List by category with compatibility filters |
| Configurator | Validate selection; price with GST; save/load/duplicate/share |
| Auth | Register, login, refresh (HTTP-only cookies), logout, forgot/reset |
| Cart | Persist for user; save-for-later; totals |
| Checkout | Address, customer details, block invalid configs, payment abstraction |
| Orders | List, detail, 9-status timeline |
| Support | Tickets, messages, attachments, statuses |
| Admin | CRUD products/components/compatibility/inventory/orders/users/tickets |
| SEO | sitemap, robots, product JSON-LD |

NukePC’s private API was **not** inspected (no auth, no network tab beyond public HTML).

---

## 17. User flows (observed vs designed)

### Observed (public)

1. Land → pick persona **or** browse prebuilds **or** lead form.  
2. Prebuild → tweak RAM/storage/color via URL → Add to Cart (if in stock).  
3. Quote path → **login required** (observed).  
4. After config: consultant call → quote → 20% → build → 48h test → ship.  
5. Issues → WhatsApp or support portal (phone login).

### AetherForge (to implement — self-serve)

1. Browse / configure without waiting for a call.  
2. Compatibility engine blocks invalid checkout.  
3. Save configs, cart, checkout (COD + test payment).  
4. Dashboard, orders timeline, in-app support tickets.  
5. Admin RBAC.

---

## 18. Missing / uncertain functionality

| Topic | Status |
|---|---|
| Full quote wizard steps | UNCERTAIN (login wall) |
| Compatibility rules | Not visible publicly |
| Sign-in/up field list & validation | UNCERTAIN (CSR) |
| Forgot/reset on main site | `/forgot-password` 404 |
| Cart / checkout / payment provider | UNCERTAIN |
| Order status machine | UNCERTAIN |
| My Config / Dashboard / Admin UI | Not publicly reachable |
| Filter/sort on `/prebuild` | Not in crawler text |
| Guest vs logged-in cart | UNCERTAIN |
| Real viewport QA (overflow, sticky summary) | Not performed |
| Sitemap contents | 500 error |

**Not copied:** logos, product photos, exact CSS, NukePC catalog names/prices in the AetherForge store, testimonials, or legal copy.

---

## 19. AetherForge mapping

| NukePC (observed) | AetherForge |
|---|---|
| `/` | `/` |
| `/prebuild`, `/prebuild/:slug` | `/prebuild`, `/prebuild/:slug` |
| `/quote/:persona` (auth) | `/configure` (public wizard + login to save) |
| `/gallery` | `/gallery` |
| `/about` `/faq` `/contact-us` | same paths |
| policies | `/refund-policy` `/privacy-policy` `/terms-of-service` |
| `/sign-in` `/sign-up` | plus `/forgot-password` `/reset-password` |
| My Configurations (path unknown) | `/my-config` |
| Support subdomain | `/support` in-app |
| Admin unknown | `/admin/*` |

Brand: **AetherForge** — original premium dark theme, INR + GST, India delivery, fictional catalog.
