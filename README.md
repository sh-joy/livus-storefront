# LIVUS

Online clothing and accessories store for Bangladesh (prices in BDT). Customers browse For Him / For Her / Unisex / Accessories, check out with Cash on Delivery, bKash or Nagad, and receive email confirmations. Staff manage products, orders, promos, reviews and settings in a built-in admin panel at `/admin`.

**Deploying or going live?** Follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), then [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).

## Tech stack

- **Next.js 16** (App Router, Server Actions) + React + TypeScript + Tailwind CSS
- **Drizzle ORM** on **Neon** serverless Postgres
- **Better Auth** for customer sign-in (email/password, Google, Facebook, optional Apple); separate signed cookie for admin sessions
- **Brevo** for transactional email (REST API, SMTP fallback)
- **Vercel** hosting + **Vercel Blob** for uploaded images
- **Vitest** unit tests, GitHub Actions CI (`.github/workflows/ci.yml`)

> This Next.js version has breaking changes from older releases — see `AGENTS.md` and `node_modules/next/dist/docs/`.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in at least DATABASE_URL and BETTER_AUTH_SECRET
npm run dev                  # http://127.0.0.1:3000
```

- Use a **Neon test branch** for `DATABASE_URL` locally, not the production database.
- `npm run dev:lan` listens on all interfaces so you can open `http://<your-computer-ip>:3000` on a phone on the same Wi-Fi.
- Every variable is explained in `.env.example` and in the table in `docs/DEPLOYMENT.md`. In production the app validates them at startup (`src/lib/env.ts`, called from `src/instrumentation.ts`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on 127.0.0.1:3000 |
| `npm run dev:lan` | Dev server reachable from other devices on your network |
| `npm run build` / `npm start` | Production build / run the build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run admin:set-password -- <email> <password> "<name>" <superadmin\|admin>` | Create an admin or rotate its password in the database that `DATABASE_URL` points to |

## Project structure

```
src/
  app/                 Routes (App Router)
    page.tsx, for-him/, for-her/, unisex/, accessories/, product/[slug]/,
    checkout/, order-confirmed/, signin/, profile/, …   Storefront
    admin/             Admin panel (orders, products, categories, promos,
                       customers, reviews, analytics, settings, …)
    actions/           Server actions (checkout, orders, products, reviews,
                       admin-actions, auth-actions, abandoned-carts, …)
    api/               Route handlers (Better Auth, image upload, products, promo)
    sitemap.ts, robots.ts, manifest.ts
  components/          Shared UI (Navbar, Footer, CartDrawer, ProductGrid, …)
  db/schema.ts         Drizzle table definitions
  lib/
    order-pricing.ts   Server-side price/VAT/delivery calculation (never trust the client)
    admin-session.ts   Signed admin session cookie; admin-guard.ts checks it
    rate-limit.ts      Database-backed rate limiting
    email.ts           Brevo email sending + templates
    auth.ts            Better Auth server config (auth-client.ts for the browser)
    env.ts             Startup environment validation
  instrumentation.ts   Runs env validation once when the server starts
  proxy.ts             Request proxy (formerly middleware)
drizzle/
  0000_*.sql           Initial schema
  manual/000N_*.sql    Additive migrations, run in order in the Neon SQL editor
scripts/               One-off maintenance scripts (run with npx tsx)
docs/                  DEPLOYMENT, LAUNCH_CHECKLIST, SQA_REPORT
```

## Database changes

Edit `src/db/schema.ts`, then add a new numbered, additive SQL file in `drizzle/manual/` (use `IF NOT EXISTS`). Test it on a Neon branch, then run it on production — see `docs/DEPLOYMENT.md` §c.
