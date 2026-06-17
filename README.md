# Neon Studio (NeonCode Dashboard)

Full-stack **Next.js 16** platform for user billing, Meta ad account management, admin operations, support tickets, live chat, and team profiles.

**Production VPS:** `217.216.108.237`  
**Deploy guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Features

| Area | Description |
|------|-------------|
| **User dashboard** | Wallet, top-up, payment history, Meta ad accounts, spending limits, profile |
| **Admin dashboard** | Users, transactions, ad accounts, activity, live chat, support, Meta logs |
| **Payments** | UddoktaPay / Paymently integration, manual bank transfer |
| **Meta Ads** | Ad account requests, budget updates, live spend via Graph API |
| **Auth** | Email/password, Google OAuth, Cloudflare Turnstile, email verification |
| **Support** | Tickets, departments, admin inbox |
| **Live chat** | User ↔ admin messaging (optional OpenAI assist) |
| **Team members** | Public team cards (`/teammember/card/[publicId]`) |

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Database:** MongoDB (`neoncode_dashboard_db`)
- **Auth:** NextAuth v5
- **Styling:** Tailwind CSS 4
- **Rate limiting:** Upstash Redis (optional but recommended in production)
- **Build output:** `standalone` (optimized for VPS / PM2)

---

## Requirements

- **Node.js** 20.x or 22.x (LTS)
- **npm** 10+
- **MongoDB** 6+ (Atlas or self-hosted)
- **Reverse proxy** (Nginx) for production HTTPS

---

## Quick start (local)

```bash
# 1. Clone and install
git clone <your-repo-url> nionstidio
cd nionstidio
npm install

# 2. Environment
cp .env.example .env.local
# Edit .env.local — see DEPLOYMENT.md for all variables

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start after `build` (non-standalone) |
| `npm run prepare:standalone` | Copy `public`, static assets, `.env.local` into standalone bundle |
| `npm run start:standalone` | Run `.next/standalone/server.js` |
| `npm run standalone` | Build + prepare + start standalone (one command) |
| `npm run lint` | ESLint |

---

## Project structure

```
app/
  admin-dashboard/     # Admin UI (users, transactions, meta-ads, chats, …)
  user-dashboard/      # End-user dashboard
  team-member-dashboard/
  api/                 # Route handlers (auth, payment, ads, admin, …)
components/            # Shared React components
lib/                   # MongoDB, auth, currency, Meta API helpers
hooks/                 # Client hooks
middleware.js          # Rate limiting, security headers
scripts/
  prepare-standalone.mjs
  mongodb-indexes.mongo.js
```

---

## Environment variables

Copy `.env.example` to `.env.local` (development) or `.env.local` on the server (production).

**Required for core app:**

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` / `NEXT_PUBLIC_BASE_URL`

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full list (payments, Meta, SMTP, WhatsApp, Turnstile, Redis, etc.).

---

## Database

- Database name: **`neoncode_dashboard_db`** (set in `lib/mongodb.js`)
- After first deploy, run indexes from `scripts/mongodb-indexes.mongo.js` in `mongosh`

---

## Production deployment (summary)

1. SSH into VPS: `ssh root@217.216.108.237`
2. Install Node.js, Nginx, PM2, MongoDB (or use Atlas)
3. Clone repo, `npm ci`, configure `.env.local`
4. `npm run build && npm run prepare:standalone`
5. PM2 → `node .next/standalone/server.js` on port `3000`
6. Nginx reverse proxy + Certbot SSL for your domain

**Full step-by-step:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Default URLs (after deploy)

| URL | Role |
|-----|------|
| `/` | Landing / login redirect |
| `/login` | Sign in |
| `/user-dashboard/overview` | User home |
| `/admin-dashboard/overview` | Admin home |

Point your domain A record to **`217.216.108.237`** and set `NEXT_PUBLIC_BASE_URL` to `https://your-domain.com`.

---

## Security notes

- Never commit `.env.local` or secrets to Git
- Use strong `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- Enable **Upstash Redis** in production for API rate limiting
- Keep **Cloudflare Turnstile** enabled on auth routes in production
- Run the app behind HTTPS only (Nginx + Let's Encrypt)

---

## License

Private — NeonCode / Neon Studio. All rights reserved.
