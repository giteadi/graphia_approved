# GraphiaCheck — Deployment Guide

**Domain:** graphiacheck.in  
**Server IP:** 195.35.45.17  
**SSH User:** aditya (upload) / root (server management)  
**SSH Key:** `~/.ssh/id_ed25519`  
**Backend Port:** 3002 (PM2, process name: `graphia`)  
**Backend running at:** `/root/graphia/`  
**Frontend served at:** `/var/www/graphiacheck/`  

---

## Project Structure (Local Mac)

```
dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/
├── .env                          ← Frontend env (VITE_API_URL, GEMINI_API_KEY)
├── src/
│   ├── main.tsx                  ← Router + AuthProvider
│   ├── pages/
│   │   ├── LoginPage.tsx         ← Login / Register / ForgotPassword
│   │   ├── UserDashboard.tsx     ← User dashboard + reports + payments
│   │   └── AdminDashboard.tsx    ← Admin panel
│   ├── context/AuthContext.tsx   ← JWT auth state
│   ├── services/api.ts           ← Axios client + all API calls
│   ├── components/ProtectedRoute.tsx
│   └── vite-env.d.ts             ← Vite + Razorpay type declarations
└── backend/
    ├── .env                      ← Backend env (DB, JWT, SMTP, Razorpay)
    ├── package.json
    └── src/
        ├── server.js             ← Entry point (auto-migrate + auto-seed)
        ├── config/
        │   ├── db.js             ← MySQL pool (127.0.0.1)
        │   ├── migrate.js        ← Auto DB migration on startup
        │   └── seed.js           ← Manual seed script
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── admin.controller.js
        │   ├── assessment.controller.js
        │   ├── dashboard.controller.js
        │   ├── payment.controller.js
        │   ├── student.controller.js
        │   └── user.controller.js
        ├── models/
        │   ├── User.model.js
        │   ├── Student.model.js
        │   ├── Assessment.model.js
        │   ├── AnalysisResult.model.js
        │   ├── Otp.model.js
        │   └── Payment.model.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── admin.routes.js
        │   ├── assessment.routes.js
        │   ├── dashboard.routes.js
        │   ├── payment.routes.js
        │   ├── student.routes.js
        │   └── user.routes.js
        ├── middlewares/
        │   ├── auth.middleware.js
        │   ├── upload.middleware.js
        │   └── validate.middleware.js
        ├── services/
        │   ├── email.service.js
        │   ├── gemini.service.js
        │   └── razorpay.service.js
        └── utils/
            ├── logger.js
            └── response.js
```

---

## Server File Locations

| What | Server Path |
|------|-------------|
| Backend code | `/root/graphia/` |
| Backend .env | `/root/graphia/.env` |
| Backend uploads | `/root/graphia/uploads/` |
| Backend logs | `/root/graphia/logs/` |
| Frontend build | `/var/www/graphiacheck/` |
| Nginx config | `/etc/nginx/sites-available/graphiacheck` |
| Nginx enabled | `/etc/nginx/sites-enabled/graphiacheck` |
| Nginx error log | `/var/log/nginx/error.log` |
| Nginx access log | `/var/log/nginx/access.log` |

---

## Frontend .env (Local)

```env
# dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/.env
GEMINI_API_KEY=AIzaSyAQ_Mf6d4vl_X4YZgc0--WR00_8THCTJUs
VITE_API_URL=http://graphiacheck.in/api
VITE_RAZORPAY_KEY_ID=rzp_live_RuZlqciKwvcmLJ
```

---

## Backend .env (Server: /root/graphia/.env)

```env
PORT=3002
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<mysql_password>
DB_NAME=dysgraphia_db
JWT_SECRET=DysByMsl@123
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyAQ_Mf6d4vl_X4YZgc0--WR00_8THCTJUs
UPLOAD_MAX_SIZE_MB=30
UPLOAD_DIR=uploads
FRONTEND_URL=http://graphiacheck.in
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ANALYSIS_RATE_LIMIT_MAX=10
EMAIL_SERVICE=gmail
EMAIL_USER=iplanbymsl@gmail.com
EMAIL_PASSWORD=qcbpdegihduilvql
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=iplanbymsl@gmail.com
SMTP_PASS=qcbpdegihduilvql
SMTP_FROM="GraphiaCheck <iplanbymsl@gmail.com>"
RAZORPAY_KEY_ID=rzp_live_RuZlqciKwvcmLJ
RAZORPAY_KEY_SECRET=60bnM5xSBYo6RYdz2FWBtob0
RAZORPAY_WEBHOOK_SECRET=60bnM5xSBYo6RYdz2FWBtob0
```

---

## Nginx Config (/etc/nginx/sites-available/graphiacheck)

```nginx
server {
    listen 80;
    server_name graphiacheck.in www.graphiacheck.in;

    root /var/www/graphiacheck;
    index index.html;

    # Frontend — React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploaded images
    location /uploads/ {
        proxy_pass http://127.0.0.1:3002/uploads/;
    }
}
```

---

## DNS Records (Domain Registrar)

| Type | Name | Content | TTL |
|------|------|---------|-----|
| A | @ (graphiacheck.in) | 195.35.45.17 | 14400 |
| CNAME | www | graphiacheck.in | 300 |

---

## Deploy Commands

### Backend Upload (Local Mac → Server)

```bash
# Upload backend (node_modules aur .env exclude)
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='uploads' \
  --exclude='logs' \
  -e "ssh -i ~/.ssh/id_ed25519" \
  /Users/adityasharma/Desktop/dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/backend/ \
  aditya@195.35.45.17:/home/aditya/graphia-backend/

# .env bhi upload karna ho to (bina exclude ke)
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='uploads' \
  --exclude='logs' \
  -e "ssh -i ~/.ssh/id_ed25519" \
  /Users/adityasharma/Desktop/dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/backend/ \
  aditya@195.35.45.17:/home/aditya/graphia-backend/
```

### Single File Upload (Local Mac → Server)

```bash
scp -i ~/.ssh/id_ed25519 \
  /Users/adityasharma/Desktop/dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/backend/src/config/migrate.js \
  aditya@195.35.45.17:/home/aditya/graphia-backend/src/config/migrate.js
```

### aditya → root copy (Server pe)

```bash
# Poora backend copy
cp -r /home/aditya/graphia-backend/. /root/graphia/

# Single file copy
cp /home/aditya/graphia-backend/src/config/migrate.js /root/graphia/src/config/migrate.js
```

### Backend Setup (Server pe — pehli baar)

```bash
cd /root/graphia
npm install
npm install -g pm2
pm2 start src/server.js --name graphia
pm2 startup
pm2 save
```

### Backend Restart (Code update ke baad)

```bash
cp -r /home/aditya/graphia-backend/. /root/graphia/
pm2 restart graphia
pm2 logs graphia --lines 20
```

---

### Frontend Build + Upload (Local Mac)

```bash
# Step 1 — Build
cd /Users/adityasharma/Desktop/dysgraphia-analysis-pro---ai-handwriting-diagnostics-2
npm run build

# Step 2 — Upload dist to server
rsync -avz --progress \
  -e "ssh -i ~/.ssh/id_ed25519" \
  /Users/adityasharma/Desktop/dysgraphia-analysis-pro---ai-handwriting-diagnostics-2/dist/ \
  aditya@195.35.45.17:/home/aditya/graphia-frontend/
```

### Frontend Deploy (Server pe)

```bash
# dist ko /var/www/graphiacheck me copy karo
cp -r /home/aditya/graphia-frontend/. /var/www/graphiacheck/

# Permissions fix karo
chown -R www-data:www-data /var/www/graphiacheck
chmod -R 755 /var/www/graphiacheck

# Nginx reload
nginx -t && systemctl reload nginx
```

---

## Useful Server Commands

```bash
# PM2 status
pm2 status

# Backend logs live
pm2 logs graphia

# Last 50 lines
pm2 logs graphia --lines 50

# Nginx error log
tail -30 /var/log/nginx/error.log

# Nginx access log
tail -30 /var/log/nginx/access.log

# Nginx test + reload
nginx -t && systemctl reload nginx

# MySQL check
mysql -u root -p -e "SHOW DATABASES;"
mysql -u root -p dysgraphia_db -e "SHOW TABLES;"

# Check port
ss -tlnp | grep 3002

# Check site response
curl -I http://graphiacheck.in
```

---

## Admin Login (First Time)

```
URL:      http://graphiacheck.in/admin
Email:    admin@graphiacheck.com
Password: Admin@1234
```

> ⚠️ Pehle login ke baad password zaroor change karo.

---

## Common Issues & Fixes

### Issue: Migration fails (ECONNREFUSED ::1:3306)
`migrate.js` mein `localhost` → `127.0.0.1` use karo.

### Issue: Nginx 500 — Permission denied on /root/
Frontend `/root/` ke andar nahi rakhni — `/var/www/graphiacheck/` use karo.

### Issue: Frontend API calls fail (CORS)
Backend `.env` mein `FRONTEND_URL=http://graphiacheck.in` set karo, PM2 restart karo.

### Issue: Backend nahi chal raha
```bash
pm2 logs graphia --lines 30
# Error dekho, phir fix karo
pm2 restart graphia
```

### Issue: Frontend purana dikh raha hai (cache)
Browser hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`

---

## Update Flow (Code change ke baad)

```
1. Local pe changes karo
2. Backend change: rsync → cp → pm2 restart
3. Frontend change: npm run build → rsync → cp → nginx reload
```