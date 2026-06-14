# GraphiaCheck — Deployment Guide

**Domain:** graphiacheck.in  
**Server IP:** 195.35.45.17  
**SSH User:** aditya (upload) / root (server management)  
**SSH Key:** `~/.ssh/id_ed25519`  
**Backend Port:** 3002 (PM2, process name: `graphia`)  
**Backend running at:** `/root/graphia/` (entry: `index.ts`)  
**Frontend served at:** `/var/www/graphiacheck/`

---

## Project Structure (Local Mac)

```
graphia/
├── .env                          ← Backend env (OpenAI keys, DB, JWT)
├── .env.example                  ← Env template
├── index.html
├── vite.config.ts                ← Proxy: /api → localhost:3002
├── package.json
├── tsconfig.json
├── public/
│   ├── pdf.worker.min.mjs
│   └── qa/
├── server/                       ← Backend (NOT used by PM2 — see note below)
│   ├── index.ts                  ← Entry point
│   ├── app.ts                    ← Express app + CORS
│   ├── config/
│   │   ├── db.ts                 ← MySQL hardcoded: root/Tiger@123/graphia
│   │   └── openai.ts             ← Primary + backup key with auto-fallback
│   ├── controllers/
│   │   ├── analyzeController.ts  ← 3-step OCR → scoring → narrative
│   │   └── authController.ts     ← Register/Login (JWT 100yr expiry)
│   ├── middleware/
│   │   └── authMiddleware.ts     ← No token validation — header passthrough
│   ├── routes/
│   │   ├── analyzeRoutes.ts
│   │   ├── authRoutes.ts
│   │   └── modelsRoute.ts
│   └── utils/
│       ├── scoreEngine.ts
│       └── scoreEngine.test.ts
└── src/                          ← Frontend (React + Vite)
    ├── App.tsx                   ← Main report UI
    ├── Root.tsx                  ← Auth wrapper (login/register screen)
    ├── main.tsx
    ├── index.css
    ├── components/
    │   └── AuthPage.tsx
    └── services/
        ├── authService.ts        ← Login/Register API calls
        └── gemini.ts             ← analyzeHandwriting() — sends x-user headers
```

> ⚠️ **IMPORTANT:** PM2 on server runs `npx tsx index.ts` from `/root/graphia/` — this means it uses `/root/graphia/index.ts`, `/root/graphia/app.ts`, `/root/graphia/middleware/` etc. NOT the `server/` subfolder. When uploading server changes, copy to both locations or update `/root/graphia/` directly.

---

## Server File Locations (Runtime Paths - PM2)

| What | Server Path |
|------|-------------|
| PM2 entrypoint | `/root/graphia/index.ts` (imports ./app.js) |
| Routes | `/root/graphia/routes/` |
| Analyze controller | `/root/graphia/controllers/analyzeController.ts` |
| Score engine | `/root/graphia/utils/scoreEngine.ts` |
| Backend app | `/root/graphia/app.ts` |
| Auth middleware | `/root/graphia/middleware/authMiddleware.ts` |
| Config | `/root/graphia/config/` |
| Backend .env | `/root/graphia/.env` |
| Frontend build | `/var/www/graphiacheck/` |
| Nginx config | `/etc/nginx/sites-available/graphiacheck` |
| Nginx enabled | `/etc/nginx/sites-enabled/graphiacheck` |
| PM2 logs out | `/root/.pm2/logs/graphia-out.log` |
| PM2 logs err | `/root/.pm2/logs/graphia-error.log` |

---

## Local to Server File Mapping

**CRITICAL:** Local repo structure differs from server runtime structure. When deploying, map files correctly:

| Local Path (Mac repo) | Server Runtime Path |
|----------------------|---------------------|
| `server/controllers/analyzeController.ts` | `/root/graphia/controllers/analyzeController.ts` |
| `server/utils/scoreEngine.ts` | `/root/graphia/utils/scoreEngine.ts` |
| `server/routes/analyzeRoutes.ts` | `/root/graphia/routes/analyzeRoutes.ts` |
| `server/config/openai.ts` | `/root/graphia/config/openai.ts` |
| `server/config/db.ts` | `/root/graphia/config/db.ts` |
| `server/middleware/authMiddleware.ts` | `/root/graphia/middleware/authMiddleware.ts` |

**Note:** Server does NOT use `/root/graphia/server/` subfolder. PM2 runs from `/root/graphia/` root directly.

---

## Verify Before Restart Checklist

After uploading files to server, run these verification steps before restarting PM2:

```bash
cd /root/graphia

# 1. CRITICAL: Check for duplicate variable declarations (causes crashes)
sudo grep -n "const norm" controllers/analyzeController.ts
# Should return exactly 1 match at line ~611

# 2. Check route structure
cat routes/analyzeRoutes.ts | head

# 3. Verify controller imports scoreEngine from correct path
rg -n "from '../utils/scoreEngine" controllers/analyzeController.ts
# Should show: import from '../utils/scoreEngine.js'

# 4. Verify scoreEngine has expected changes
rg -n "visualImpairedCount" utils/scoreEngine.ts
rg -n "Math.round.*correct.*totalWords.*100" utils/scoreEngine.ts

# 5. Check for cancellation guardrail (if added)
rg -n "fixCancellationPatterns" controllers/analyzeController.ts

# 6. Optional: Run tests if available (skip in production)
# npm -s test

# 7. Restart PM2 only after verification passes
pm2 restart graphia --update-env
pm2 save

# 8. Check logs for errors
pm2 logs graphia --lines 30
```

**Common Issues & Fixes:**
- **"norm already declared"** → Duplicate variable declaration in analyzeController.ts (line 611 & 737). Fix: remove duplicate.
- **"Cannot find module"** → Wrong import path in controller. Should be `../utils/scoreEngine.js`
- **"TransformError"** → TypeScript compilation error. Run `npm run lint` locally first.
- **"module not found"** → Wrong runtime path. Use `/root/graphia/utils/` NOT `/root/graphia/server/utils/`
- **PM2 keeps crashing** → Check `pm2 logs graphia` for the actual error, fix source file, then restart.

---

## Important Notes

**Production Runtime Paths:**
- Production uses `/root/graphia/controllers/*` and `/root/graphia/utils/*`
- Copying files to `/root/graphia/server/*` will NOT affect runtime
- Always copy to the root paths shown in the mapping table above

**UI Verification After Deployment:**
- After backend deployment, hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Browser caching may show old reports/PDFs
- Verify spelling score and probability in fresh browser session
- Check PM2 logs to confirm backend is using new code

---

## .env File (Local + Server)

```env
PORT=3002
VITE_OPENAI_API_KEY=<primary_key>
VITE_OPENAI_API_KEY_BACKUP=<backup_key>
JWT_SECRET=graphia_jwt_super_secret_2024
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=graphia
```

> Server pe DB password `Tiger@123` hai — `db.ts` mein hardcoded hai (env se nahi aata).

---

## Auth System

- Login/Register form se user DB mein verify hota hai (bcrypt password check)
- JWT token generate hota hai **100 year expiry** ke saath
- `/api/analyze` route pe **token validation nahi** — sirf `x-user-id` aur `x-user-email` headers se user identify hota hai
- Frontend `gemini.ts` mein `localStorage` se user info uthata hai aur headers mein bhejta hai

---

## Database

- MySQL local: `127.0.0.1:3306`
- DB name: `graphia`
- Tables auto-create on server start (`initDB()`)
- Tables: `users`, `reports`
- Server pe credentials hardcoded in `db.ts`: `root` / `Tiger@123`

---

## OpenAI Key Fallback

- Primary key quota exceed hone pe automatic backup key use hota hai
- `withFallback()` function `server/config/openai.ts` (ya `config/openai.ts`) mein hai
- HTTP 429 ya `insufficient_quota` error pe switch hota hai

---

## Nginx Config (/etc/nginx/sites-available/graphiacheck)

```nginx
server {
    listen 80;
    server_name graphiacheck.in www.graphiacheck.in;

    root /var/www/graphiacheck;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## DNS Records

| Type | Name | Content | TTL |
|------|------|---------|-----|
| A | @ (graphiacheck.in) | 195.35.45.17 | 14400 |
| CNAME | www | graphiacheck.in | 300 |

---

## Deploy Commands

### Backend Upload (Local Mac → Server)

**IMPORTANT:** Use individual file uploads to ensure correct path mapping.

```bash
# Upload analyzeController.ts
scp -i ~/.ssh/id_ed25519 \
  /Users/adityasharma/Desktop/graphia/server/controllers/analyzeController.ts \
  aditya@195.35.45.17:/home/aditya/analyzeController.ts

# Upload scoreEngine.ts
scp -i ~/.ssh/id_ed25519 \
  /Users/adityasharma/Desktop/graphia/server/utils/scoreEngine.ts \
  aditya@195.35.45.17:/home/aditya/scoreEngine.ts

# Upload any other changed files individually
# Example: config, routes, middleware
scp -i ~/.ssh/id_ed25519 \
  /Users/adityasharma/Desktop/graphia/server/config/openai.ts \
  aditya@195.35.45.17:/home/aditya/openai.ts
```

### Frontend Build + Upload (Local Mac)

```bash
# Step 1 — Build
cd /Users/adityasharma/Desktop/graphia
npm run build

# Step 2 — Upload dist
rsync -avz --progress \
  -e "ssh -i ~/.ssh/id_ed25519" \
  /Users/adityasharma/Desktop/graphia/dist/ \
  aditya@195.35.45.17:/home/aditya/graphia-frontend/
```

### Server Deploy (SSH pe)

```bash
# Backend — copy individual files to correct runtime paths
# IMPORTANT: Use /root/graphia/ NOT /root/graphia/server/ for runtime
sudo cp /home/aditya/analyzeController.ts /root/graphia/controllers/analyzeController.ts
sudo cp /home/aditya/scoreEngine.ts /root/graphia/utils/scoreEngine.ts

# Copy other files as needed (example)
sudo cp /home/aditya/openai.ts /root/graphia/config/openai.ts

# Frontend
rm -rf /var/www/graphiacheck/*
cp -r /home/aditya/graphia-frontend/. /var/www/graphiacheck/
chown -R www-data:www-data /var/www/graphiacheck
chmod -R 755 /var/www/graphiacheck

# Verify before restart (see checklist below)
cd /root/graphia

# Critical: Check for duplicate variable declarations (causes crashes)
sudo grep -n "const norm" controllers/analyzeController.ts
# Should return exactly 1 match

# Verify specific function changes
sudo rg -n "visualImpairedCount" utils/scoreEngine.ts
sudo rg -n "from '../utils/scoreEngine" controllers/analyzeController.ts

# Backend restart
pm2 restart graphia --update-env
pm2 save

# Check logs for errors
pm2 logs graphia --lines 30

# Nginx reload (if frontend changed)
nginx -t && systemctl reload nginx
```

### Backend First Time Setup (Server pe)

```bash
cd /root/graphia
npm install
pm2 start node_modules/.bin/tsx --name graphia -- server/index.ts
# OR (if files are in root directly)
pm2 start /bin/bash --name graphia -- -c "npx tsx index.ts"
pm2 startup
pm2 save
```

---

## Useful Server Commands

```bash
# PM2 status
pm2 list

# Backend logs live
pm2 logs graphia

# Last 30 lines
pm2 logs graphia --lines 30

# Restart with env refresh
pm2 restart graphia --update-env

# Health check
curl http://localhost:3002/health

# Check port
ss -tlnp | grep 3002

# Kill port if stuck
fuser -k 3002/tcp

# MySQL check
mysql -u root -pTiger@123 -e "SHOW DATABASES;"
mysql -u root -pTiger@123 graphia -e "SHOW TABLES;"

# Nginx test + reload
nginx -t && systemctl reload nginx

# Nginx error log
tail -30 /var/log/nginx/error.log
```

---

## Common Issues & Fixes

### Issue: EADDRINUSE port 3002
```bash
fuser -k 3002/tcp
pm2 restart graphia --update-env
```

### Issue: ERR_MODULE_NOT_FOUND server/index.ts
PM2 `exec cwd` is `/root/graphia/` and runs `index.ts` directly — files must be in `/root/graphia/` root, not in `server/` subfolder. Copy files accordingly.

### Issue: 401 Unauthorized
Auth middleware uses header passthrough — no token needed. If getting 401, check `/root/graphia/middleware/authMiddleware.ts` has no JWT validation.

### Issue: DB connection refused
`db.ts` uses hardcoded `127.0.0.1:3306` with `root`/`Tiger@123`. Verify MySQL is running:
```bash
systemctl status mysql
```

### Issue: Frontend showing old version
```bash
rm -rf /var/www/graphiacheck/*
cp -r /home/aditya/graphia-frontend/. /var/www/graphiacheck/
```
Browser: `Cmd+Shift+R` hard refresh.

### Issue: OpenAI quota exceeded
Backup key auto-switches on 429. Check both keys are set in `/root/graphia/.env`.

---

## Update Flow

```
1. Local pe changes karo
2. npm run build (frontend changes ke liye)
3. rsync upload (backend + frontend)
4. SSH → cp to correct paths → pm2 restart → nginx reload
```
