# Server Infrastructure, Credentials & Deployment Guide

> **Confidential Document**: Contains production VPS infrastructure access details, paths, security rules, and deployment procedures for GraphiaCheck.

---

## 1. Server Overview

| Property | Value |
| :--- | :--- |
| **Server IP** | `195.35.45.17` |
| **Provider** | Hostinger VPS (KVM 2) |
| **Virtual Machine ID** | `749165` |
| **Hostname** | `srv749165.hstgr.cloud` |
| **Operating System** | Ubuntu 24.04 LTS (x86_64) |
| **Hardware Specs** | 2 vCPUs · 8 GB RAM · 100 GB NVMe Disk |
| **Production Domain** | `https://graphiacheck.in` & `https://www.graphiacheck.in` |
| **SSL Certificate** | Let's Encrypt Certbot (`/etc/letsencrypt/live/graphiacheck.in/`) |

---

## 2. Credentials & SSH Access

### User Accounts

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. User: aditya                                                        │
│    - SSH Auth: Public Key (~/.ssh/id_ed25519)                          │
│    - SSH Key Passphrase: 1234                                          │
│    - Sudo Password: RuhiRiya@12345                                     │
│                                                                        │
│ 2. User: root                                                          │
│    - Password: RuhiRiya@12345                                          │
│    - Note: Direct root SSH is disabled by sshd_config (AllowUsers aditya) │
│    - Elevation: SSH as aditya, then run `sudo -i` or `sudo su -`       │
└────────────────────────────────────────────────────────────────────────┘
```

### ⚠️ Fail2ban Safety Rule (CRITICAL)
- **Active Jail**: `[sshd]` with `nftables` banaction.
- **Rule**: Never enter incorrect SSH passwords multiple times or the server IP will trigger a ban.
- **Safe SSH Method**:
  ```bash
  # Step 1: Add key to ssh-agent with passphrase (1234)
  sshpass -P "passphrase" -p "1234" ssh-add ~/.ssh/id_ed25519

  # Step 2: Connect seamlessly as aditya
  ssh aditya@195.35.45.17

  # Step 3: Elevate to root (Password: RuhiRiya@12345)
  sudo -i
  ```

---

## 3. Production Project Locations

### Frontend Web App (React / Vite SPA)
- **Filesystem Location**: `/var/www/graphiacheck/`
- **Ownership**: `www-data:www-data`
- **Permissions**: `755` for directories, `644` for files
- **Assets Directory**: `/var/www/graphiacheck/assets/`
- **Static Public Images**:
  - `/var/www/graphiacheck/hero_handwriting_ai.jpg`
  - `/var/www/graphiacheck/sketch_handwriting_neuro.jpg`
- **Nginx Serving Root**: `/var/www/graphiacheck` (SPA routing via `try_files $uri $uri/ /index.html;`)

### Backend API (Node.js / Express / TypeScript via TSX)
- **Filesystem Location**: `/root/graphia/`
- **Process Manager**: PM2 (under `root`)
- **PM2 Process ID**: `3`
- **PM2 Process Name**: `graphia`
- **Active Startup Command**: `npx tsx index.ts` (working directory: `/root/graphia`)
- **Port**: `3002` (internal localhost only)
- **Log Files**:
  - Standard Out: `/root/.pm2/logs/graphia-out.log`
  - Errors: `/root/.pm2/logs/graphia-error.log`
- **Key Backend Files**:
  - `/root/graphia/controllers/analyzeController.ts` (Diagnostic OCR & AI analysis)
  - `/root/graphia/utils/scoreEngine.ts` (Normative scoring & grade benchmarks)
  - `/root/graphia/utils/evidenceSanitizer.ts` (Cancellation sanitizer)
  - `/root/graphia/routes/analyzeRoutes.ts`
  - `/root/graphia/app.ts` & `/root/graphia/index.ts`
  - `/root/graphia/.env` (Database & OpenAI keys)

---

## 4. Nginx Server Configuration

Config file location: `/etc/nginx/sites-available/graphiacheck` (symlinked in `/etc/nginx/sites-enabled/graphiacheck`)

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name graphiacheck.in www.graphiacheck.in;
    root /var/www/graphiacheck;
    index index.html;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy to backend Node.js (Port 3002)
    location /api/ {
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL Certificates (Certbot)
    ssl_certificate /etc/letsencrypt/live/graphiacheck.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/graphiacheck.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP to HTTPS automatic redirection
server {
    listen 80;
    server_name graphiacheck.in www.graphiacheck.in;
    return 301 https://$host$request_uri;
}
```

---

## 5. Deployment Procedures (Step-by-Step)

### A. Deploying Frontend Changes
```bash
# 1. Build production bundle locally
npm run build

# 2. Upload dist/ to temporary folder on server
rsync -avz dist/ aditya@195.35.45.17:/home/aditya/temp_dist/

# 3. Elevate to root and copy to Nginx folder
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S bash -c '
  cp -r /home/aditya/temp_dist/* /var/www/graphiacheck/
  chown -R www-data:www-data /var/www/graphiacheck
  rm -rf /home/aditya/temp_dist
'"
```

### B. Deploying Backend File Changes (Only changed files)
```bash
# 1. Upload specific changed files to temp directory
scp server/controllers/analyzeController.ts server/utils/scoreEngine.ts server/utils/evidenceSanitizer.ts aditya@195.35.45.17:/home/aditya/

# 2. Move files into active /root/graphia/ folder and restart PM2
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S bash -c '
  cp /home/aditya/analyzeController.ts /root/graphia/controllers/
  cp /home/aditya/scoreEngine.ts /root/graphia/utils/
  cp /home/aditya/evidenceSanitizer.ts /root/graphia/utils/
  rm -f /home/aditya/analyzeController.ts /home/aditya/scoreEngine.ts /home/aditya/evidenceSanitizer.ts
  
  # Run regression test verification
  cd /root/graphia && npx tsx utils/scoreEngine.test.ts
  
  # Restart PM2 process
  pm2 restart graphia
'"
```

---

## 6. Health & Diagnostics Cheat Sheet

```bash
# Check PM2 backend status
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S pm2 status graphia"

# View real-time backend logs
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S pm2 logs graphia --lines 50"

# Check Nginx status & reload
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S nginx -t && echo 'RuhiRiya@12345' | sudo -S systemctl reload nginx"

# Check direct backend health on port 3002
ssh aditya@195.35.45.17 "curl -s http://localhost:3002/health"
```
