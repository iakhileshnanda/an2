#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$REPO_DIR/frontend"
ECHO_API_DIR="$REPO_DIR/server/echo-api"
PORTFOLIO_API_DIR="$REPO_DIR/server/portfolio-api"
NGINX_CONF_SRC="$REPO_DIR/nginx/portfolio-v2.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/portfolio-v2"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${YELLOW}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

cd "$REPO_DIR"

# ── 1. Pull latest code ──────────────────────────────────────────────────────
step "Pulling latest code"
if ! git pull 2>&1; then
  echo "git pull failed (HTTPS likely needs credentials). Skipping — deploying from current code."
fi
ok "Code up to date"

# ── 2. Install / update dependencies ────────────────────────────────────────
step "Installing frontend deps"
cd "$FRONTEND_DIR" && npm install --silent
ok "Frontend deps ready"

step "Installing echo-api deps"
cd "$ECHO_API_DIR" && npm install --silent
ok "echo-api deps ready"

step "Installing portfolio-api deps"
cd "$PORTFOLIO_API_DIR" && npm install --silent
ok "portfolio-api deps ready"

# ── 3. Build frontend ────────────────────────────────────────────────────────
step "Building frontend"
cd "$FRONTEND_DIR" && npm run build
ok "Frontend built → dist/"

# ── 4. Reload nginx config ───────────────────────────────────────────────────
step "Updating nginx config"
sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
sudo ln -sf "$NGINX_CONF_DEST" /etc/nginx/sites-enabled/portfolio-v2
sudo nginx -t || fail "nginx config test failed — not reloading"
sudo nginx -s reload
ok "nginx reloaded"

# ── 5. Restart PM2 processes ─────────────────────────────────────────────────
step "Restarting PM2 processes"

# portfolio-api
if pm2 describe portfolio-api > /dev/null 2>&1; then
  pm2 restart portfolio-api --update-env
  ok "portfolio-api restarted"
else
  cd "$PORTFOLIO_API_DIR"
  pm2 start index.js --name portfolio-api \
    --log /home/ubuntu/logs/api-v2-out.log \
    --error /home/ubuntu/logs/api-v2-error.log \
    --max-memory-restart 200M
  ok "portfolio-api started"
fi

# echo-api
if pm2 describe echo-api > /dev/null 2>&1; then
  pm2 restart echo-api --update-env
  ok "echo-api restarted"
else
  cd "$ECHO_API_DIR"
  pm2 start index.js --name echo-api \
    --log /home/ubuntu/logs/echo-api-out.log \
    --error /home/ubuntu/logs/echo-api-error.log \
    --max-memory-restart 200M
  ok "echo-api started"
fi

pm2 save
ok "PM2 state saved"

# ── 6. Health checks ─────────────────────────────────────────────────────────
step "Health checks"
sleep 2

ECHO_HEALTH=$(curl -s http://localhost:3005/health 2>/dev/null)
if echo "$ECHO_HEALTH" | grep -q '"ok"'; then
  ok "echo-api healthy → $ECHO_HEALTH"
else
  echo -e "${RED}✗ echo-api health check failed: $ECHO_HEALTH${NC}"
fi

PORTFOLIO_HEALTH=$(curl -s http://localhost:3002/health 2>/dev/null)
if echo "$PORTFOLIO_HEALTH" | grep -q '"ok"\|ok'; then
  ok "portfolio-api healthy"
else
  echo -e "${YELLOW}⚠ portfolio-api health: $PORTFOLIO_HEALTH${NC}"
fi

echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Deploy complete → https://deal.maya-ai.dev${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"
