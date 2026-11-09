# CIVORA — Production Deployment Checklist & Runbook

**Document:** Practical Deployment Runbook  
**Target:** Production Environment Operator  
**Date:** 2026-11-09  
**Version:** 1.0.0 (Phase 10 Hardened)

---

## Pre-Deployment Verification Checklist

- [ ] **Node.js Environment:** Node.js v20+ and npm installed on build system.
- [ ] **Python Environment:** Python 3.13+ installed with pip and virtualenv.
- [ ] **Persistent Disk Volume:** Storage directory identified and verified to be persistent (e.g. `/var/data/civora` or `/var/www/civora/genesis-engine/backend/db`). Ephemeral container disks are strictly avoided.
- [ ] **Full Regression Suite Passed:** All 101 backend tests passed (`pytest genesis-engine/backend/tests/ -v`).
- [ ] **Frontend Build Clean:** Production build succeeds (`npm run build`) without TypeScript errors.

---

## Stage 1: Environment & Secrets Configuration

- [ ] Copy `.env.example` to `.env` in the project root:
  ```bash
  cp .env.example .env
  chmod 600 .env
  ```
- [ ] Generate high-entropy JWT Secret:
  ```bash
  python3 -c "import secrets; print(secrets.token_hex(32))"
  ```
  Set `GENESIS_JWT_SECRET=<generated_secret>` in `.env`.
- [ ] Configure `ENVIRONMENT=production`.
- [ ] Configure `ALLOWED_ORIGINS` with exact production domain(s) (e.g. `https://civora.example.com`). Wildcards (`*`) must not be used.
- [ ] Set `HOST=127.0.0.1` and `PORT=8000`.
- [ ] Verify that `.env` is listed in `.gitignore` and never committed.

---

## Stage 2: Database Initialization & Integrity

- [ ] Verify database directory permissions (readable and writable by application user).
- [ ] Execute database integrity check before deployment:
  ```bash
  python3 genesis-engine/backend/db/backup.py verify genesis-engine/backend/db/genesis.db
  ```
- [ ] Create pre-deployment backup:
  ```bash
  python3 genesis-engine/backend/db/backup.py create
  ```
- [ ] Verify that backup snapshot was successfully created in `genesis-engine/backend/db/backups/`.

---

## Stage 3: Backend Application Startup (Systemd)

- [ ] Install Python dependencies in dedicated virtualenv:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r genesis-engine/backend/requirements.txt
  ```
- [ ] Install systemd service unit to `/etc/systemd/system/civora-engine.service`.
- [ ] Reload systemd daemon and start service:
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable civora-engine
  sudo systemctl start civora-engine
  ```
- [ ] Check service logs:
  ```bash
  sudo journalctl -u civora-engine -f
  ```
- [ ] Verify startup validation succeeded without configuration errors.

---

## Stage 4: Health & Readiness Probe Verification

- [ ] Probe Liveness Endpoint:
  ```bash
  curl -i http://127.0.0.1:8000/health/live
  # Expected: HTTP 200 OK {"status": "alive"}
  ```
- [ ] Probe Readiness Endpoint:
  ```bash
  curl -i http://127.0.0.1:8000/health/ready
  # Expected: HTTP 200 OK {"status": "ready", "database": "connected", "active_worlds": ...}
  ```
- [ ] Verify Diagnostics Protection:
  ```bash
  curl -i -X POST http://127.0.0.1:8000/api/v1/diagnostics/toggle -H "Content-Type: application/json" -d '{"enabled": false}'
  # Expected: HTTP 401 Unauthorized (protected in production mode)
  ```

---

## Stage 5: Reverse Proxy & WebSocket Configuration (Nginx)

- [ ] Configure `/etc/nginx/sites-available/civora.conf` according to `docs/production/deployment-architecture.md`.
- [ ] Test Nginx syntax:
  ```bash
  sudo nginx -t
  ```
- [ ] Obtain or renew SSL certificate via Let's Encrypt / Certbot:
  ```bash
  sudo certbot --nginx -d civora.example.com
  ```
- [ ] Reload Nginx:
  ```bash
  sudo systemctl reload nginx
  ```
- [ ] Verify WebSocket upgrade headers:
  ```bash
  wscat -c "wss://civora.example.com/ws/world/aurora-prime"
  # Expected: Connects and receives initial_state event envelope
  ```

---

## Stage 6: Automated Nightly Backup Cron

- [ ] Install cron job to `/etc/cron.d/civora-backup`:
  ```bash
  0 3 * * * civora /var/www/civora/venv/bin/python /var/www/civora/genesis-engine/backend/db/backup.py create >> /var/log/civora/backup.log 2>&1
  ```
- [ ] Verify write permissions to `/var/log/civora/`.

---

## Stage 7: Rollback Procedure (If Issues Occur)

If a critical failure occurs during deployment:

1. **Stop Application Service:**
   ```bash
   sudo systemctl stop civora-engine
   ```
2. **Restore Database from Pre-Deployment Snapshot:**
   ```bash
   python3 genesis-engine/backend/db/backup.py restore /var/www/civora/genesis-engine/backend/db/backups/genesis_backup_<TIMESTAMP>.db
   ```
3. **Revert Frontend Code / Assets:**
   ```bash
   git checkout <PREVIOUS_COMMIT_TAG>
   npm run build
   ```
4. **Restart Application Service:**
   ```bash
   sudo systemctl start civora-engine
   ```
5. **Verify Readiness:**
   ```bash
   curl http://127.0.0.1:8000/health/ready
   ```
