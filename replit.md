# JazzBazar

A mobile-first web app inspired by JazzCash, where users sign up, pick a paid membership package, verify payment via screenshot upload, and then earn money by watching ads (limited daily quota per plan) and requesting withdrawals.

## How it works

1. **Signup** (`/signup`) — 3 steps: (1) name/phone/password, (2) choose a package — Basic Rs 1500 (5 ads/day), Standard Rs 4500 (10 ads/day), Premium Rs 9500 (15 ads/day), (3) choose JazzCash or EasyPaisa, see the receiving account number (03448311279), and upload a screenshot of the transaction.
2. New accounts are created with `status = pending` and can log in immediately, but ad-earning/withdrawals are locked until an admin approves the payment.
3. **Login** (`/login`) — phone + password.
4. **Dashboard** (`/`) — JazzCash-style dark header showing balance, plan, "Watch Ads" and "Withdraw" buttons, and a pending-verification banner if not yet approved.
5. **Admin panel** (`/admin`) — separate login (seeded account: phone `admin`, password `jazzbazar786` — change this after first login). Lists pending/approved/rejected signups with their transaction screenshot so the admin can approve or reject.

## Tech stack

- Express (TypeScript) + Vite dev middleware, single server on port 5000
- React + Wouter for routing, Tailwind v4 for styling
- Drizzle ORM against an external **Neon Postgres** database (connection string stored as the `NEON_DATABASE_URL` secret — intentionally not Replit's built-in Postgres, per user request)
- Sessions stored in Postgres via `connect-pg-simple`
- Transaction screenshots uploaded via Multer to `server/uploads/`, served at `/uploads/...`

## Notable decisions

- Ad reward amount (Rs 25/ad) and minimum withdrawal (Rs 500) were not specified by the user — these are placeholders and easy to change in `shared/schema.ts` / `server/routes.ts`.
- Withdrawals are recorded as pending requests and deducted from balance immediately; there's no automated payout yet — admin would need a way to mark them paid (currently only via the withdrawals API, no UI in `/admin` yet for that).

## User preferences

None recorded yet.
