# Deployment Guide — Neon Studio on VPS

Deploy the Next.js **standalone** build on your VPS.

| Item | Value |
|------|--------|
| **VPS IP** | `217.216.108.237` |
| **App port** | `3000` (internal, behind Nginx) |
| **Database** | `neoncode_dashboard_db` |
| **Process manager** | PM2 |

---

## 1. DNS (before SSL)

Point your domain to the VPS:

```
Type   Name   Value
A      @      217.216.108.237
A      www    217.216.108.237
```

Example: `app.neoncode.co` → `217.216.108.237`

Wait for DNS propagation (5–30 minutes), then continue.

---

## 2. First-time VPS setup

SSH into the server:

```bash
ssh root@217.216.108.237
```

### 2.1 Update system

```bash
apt update && apt upgrade -y
apt install -y curl git nginx ufw certbot python3-certbot-nginx
```

### 2.2 Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

### 2.3 Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v   # v22.x
npm -v
```

### 2.4 Install PM2

```bash
npm install -g pm2
```

### 2.5 MongoDB

**Option A — MongoDB Atlas (recommended)**  
Create a free cluster, allow VPS IP `217.216.108.237` in Network Access, copy connection string to `MONGODB_URI`.

**Option B — MongoDB on same VPS**

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod
```

Connection string example:

```
MONGODB_URI=mongodb://127.0.0.1:27017/neoncode_dashboard_db
```

---

## 3. Deploy application

### 3.1 Create app user and directory

```bash
adduser --disabled-password --gecos "" neonapp
mkdir -p /var/www/neon-studio
chown -R neonapp:neonapp /var/www/neon-studio
```

### 3.2 Clone repository

As `neonapp`:

```bash
su - neonapp
cd /var/www/neon-studio
git clone <your-repo-url> .
```

### 3.3 Install dependencies

```bash
npm ci
```

### 3.4 Environment file

```bash
cp .env.example .env.local
nano .env.local
```

**Minimum production values:**

```env
NODE_ENV=production
PORT=3000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/neoncode_dashboard_db

NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://app.neoncode.co
NEXT_PUBLIC_BASE_URL=https://app.neoncode.co
APP_BASE_URL=https://app.neoncode.co

NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Payments, SMTP, Meta — see .env.example
```

> `prepare-standalone.mjs` copies `.env.local` into the standalone bundle. Keep this file on the server only — never commit it.

### 3.5 Build

```bash
npm run build
npm run prepare:standalone
```

Test manually once:

```bash
cd /var/www/neon-studio
node .next/standalone/server.js
# Visit http://217.216.108.237:3000 — then Ctrl+C
```

---

## 4. PM2 (keep app running)

Create ecosystem file:

```bash
nano /var/www/neon-studio/ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [
    {
      name: "neon-studio",
      cwd: "/var/www/neon-studio",
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "512M",
      error_file: "/var/www/neon-studio/logs/err.log",
      out_file: "/var/www/neon-studio/logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
```

```bash
mkdir -p /var/www/neon-studio/logs
pm2 start /var/www/neon-studio/ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command PM2 prints (systemd enable)
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs neon-studio
pm2 restart neon-studio
```

---

## 5. Nginx reverse proxy

Replace `app.neoncode.co` with your domain.

```bash
nano /etc/nginx/sites-available/neon-studio
```

```nginx
server {
    listen 80;
    server_name app.neoncode.co www.app.neoncode.co;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/neon-studio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL (Let's Encrypt)

```bash
certbot --nginx -d app.neoncode.co -d www.app.neoncode.co
```

Certbot auto-renews. Test renewal:

```bash
certbot renew --dry-run
```

---

## 6. MongoDB indexes

After the database is reachable, create indexes (once per environment):

```bash
mongosh "YOUR_MONGODB_URI" --file /var/www/neon-studio/scripts/mongodb-indexes.mongo.js
```

Or in `mongosh`:

```javascript
use neoncode_dashboard_db
load("/var/www/neon-studio/scripts/mongodb-indexes.mongo.js")
```

---

## 7. Post-deploy checklist

- [ ] Site loads at `https://your-domain.com`
- [ ] Login / register works
- [ ] `NEXT_PUBLIC_BASE_URL` matches HTTPS domain
- [ ] Payment webhook URL reachable: `https://your-domain.com/api/payment/callback`
- [ ] Turnstile keys set for production domain
- [ ] Admin user exists in `users` collection (`role: "admin"`)
- [ ] PM2 shows `online`: `pm2 status`
- [ ] Nginx + SSL valid (padlock in browser)

---

## 8. Updating (redeploy)

```bash
su - neonapp
cd /var/www/neon-studio

git pull origin main
npm ci
npm run build
npm run prepare:standalone

pm2 restart neon-studio
```

One-liner:

```bash
cd /var/www/neon-studio && git pull && npm ci && npm run build && npm run prepare:standalone && pm2 restart neon-studio
```

---

## 9. Troubleshooting

### App won't start

```bash
pm2 logs neon-studio --lines 100
```

Common causes:

- `MONGODB_URI` missing or wrong
- `NEXTAUTH_SECRET` not set
- Port 3000 already in use: `ss -tlnp | grep 3000`

### 502 Bad Gateway (Nginx)

- PM2 not running: `pm2 restart neon-studio`
- Wrong proxy port in Nginx config

### Build fails on VPS (low RAM)

Add swap:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Then rebuild.

### Rate limiting not working

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without Redis, middleware skips rate limits (app still runs).

### Meta ad balance / spend errors

Verify `FB_SYS_TOKEN` and Business Manager tokens in admin Meta settings.

---

## 10. Architecture diagram

```
Internet
    │
    ▼
217.216.108.237 :443 (Nginx + SSL)
    │
    ▼
127.0.0.1:3000 (Next.js standalone / PM2)
    │
    ├── MongoDB (Atlas or local :27017)
    ├── Upstash Redis (rate limit)
    ├── UddoktaPay API (payments)
    ├── Meta Graph API (ad spend)
    └── SMTP / WhatsApp (notifications)
```

---

## 11. Security hardening (recommended)

```bash
# Disable root SSH password login after adding a sudo user
# Use SSH keys only
# Keep system updated: apt update && apt upgrade -y
```

- Rotate `NEXTAUTH_SECRET` only with a planned logout (invalidates sessions)
- Restrict MongoDB to VPS IP only (Atlas) or `bindIp 127.0.0.1` (local)
- Back up MongoDB regularly (`mongodump`)

---

## Quick reference

| Task | Command |
|------|---------|
| SSH | `ssh root@217.216.108.237` |
| App logs | `pm2 logs neon-studio` |
| Restart app | `pm2 restart neon-studio` |
| Nginx test | `nginx -t` |
| Reload Nginx | `systemctl reload nginx` |
| Renew SSL | `certbot renew` |

For local development, see [README.md](./README.md).
