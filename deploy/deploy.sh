#!/bin/bash
set -e

ROOT=/home/ubuntu/apps/newakhilesh

echo ""
echo "========================================"
echo "  AKHILESH NANDA V2 — DEPLOYING"
echo "========================================"

# ── PULL LATEST ───────────────────────────
echo ""
echo "[ 1/4 ] Pulling latest code..."
cd $ROOT
git pull origin main

# ── BUILD FRONTEND ────────────────────────
echo ""
echo "[ 2/4 ] Building V2 frontend..."
cd $ROOT/frontend
npm install
npm run build

# ── SERVER ────────────────────────────────
echo ""
echo "[ 3/4 ] Installing server deps..."
cd $ROOT/server/portfolio-api
npm install --production

echo "        Restarting V2 API..."
pm2 restart portfolio-api-v2

# ── NGINX ─────────────────────────────────
echo ""
echo "[ 4/4 ] Reloading nginx..."
sudo cp $ROOT/nginx/portfolio-v2.conf /etc/nginx/sites-available/portfolio-v2
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "========================================"
echo "  DONE! V2 is live."
echo "  https://v2.akhileshnanda.maya-ai.dev"
echo "========================================"
echo ""
