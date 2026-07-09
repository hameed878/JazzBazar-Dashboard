# JazzBazar

A mobile-first web app inspired by JazzCash, where users sign up, pick a paid membership package, verify payment via screenshot upload, and then earn money (in USD) by watching video ads (limited daily quota per plan) and requesting withdrawals.

## How it works

1. **Signup** (`/signup`) — 3 steps: (1) name/phone/password, (2) choose a package — Basic Rs 1500 (5 ads/day), Standard Rs 4500 (10 ads/day), Premium Rs 9500 (15 ads/day) — prices/limits are admin-editable, (3) choose JazzCash or EasyPaisa, see the receiving account number (admin-editable, defaults to 03448311279), and upload a screenshot of the transaction.
2. New accounts are created with `status = pending` and can log in immediately, but ad-earning/withdrawals are locked until an admin approves the payment.
3. **Login** (`/login`) — phone + password.
4. **Dashboard** (`/`) — JazzCash-style dark header showing USD balance, plan, ad quota remaining, "Watch Ads" and "Withdraw" buttons, a grid of themed video ads ("Watch & Earn"), package upgrade cards, and a pending-verification banner if not yet approved. Watching an ad plays a full-screen video (fictional Pakistani-brand ads themed as Falak Mobile, Zaiqa Chips, Bazaar Online, Sohni Textiles, Speedy Riders, Karim's Kitchen) and credits the configured reward on completion.
5. **Admin panel** (`/admin`) — separate login (seeded account: phone `admin`, password `Clear@Clear` — change this after first login). Sidebar-tabbed dashboard: Overview (stats), Deposits (approve/reject signups with screenshot proof), Withdrawals (mark paid / reject-with-refund), Users (search, full edit of every field including balance/password/ban, delete), Ads (CRUD for video ads, active/hidden toggle), Settings (payment account numbers, ad reward, minimum withdrawal, package prices/labels/daily limits — all live-editable, no redeploy needed).

## Tech stack

- Express (TypeScript) + Vite dev middleware, single server on port 5000
- React + Wouter for routing, Tailwind v4 for styling
- Drizzle ORM against an external **Neon Postgres** database (connection string stored as the `NEON_DATABASE_URL` secret — intentionally not Replit's built-in Postgres, per user request)
- Sessions stored in Postgres via `connect-pg-simple`
- Transaction screenshots uploaded via Multer to `server/uploads/`, served at `/uploads/...`
- App-wide runtime config (payment numbers, ad reward, min withdrawal, packages) stored as a JSON blob in a `settings` table and read/written via `server/config.ts` — admin Settings tab edits this live.

## Notable decisions

- Earnings currency is USD (ad reward $0.50/ad, minimum withdrawal $20) while package purchase prices stay in PKR/Rs, since packages are paid via JazzCash/EasyPaisa domestically but payouts are modeled in USD per user request.
- Withdrawals are recorded as pending requests and deducted from balance immediately; admin "Pay" marks them approved/paid, admin "Reject" refunds the balance automatically.
- Ad videos use public Google GTV sample mp4s paired with AI-generated thumbnail images, labeled with fictional Pakistani-style brand names (not real trademarks) to look realistic without trademark issues. Admin can add/edit/delete ads with custom video/thumbnail URLs.

## Running the project

- `npm run dev` starts the Express + Vite dev server on port 5000 (bound to the "Start application" workflow).
- Dependencies are installed via `npm install`; after a fresh import, run this first if the workflow fails with `tsx: not found`.
- Requires the `NEON_DATABASE_URL` secret (external Neon Postgres) and `SESSION_SECRET`.

## User preferences

None recorded yet.
