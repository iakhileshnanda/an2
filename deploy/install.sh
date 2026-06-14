#!/bin/bash
set -e

ROOT=/home/ubuntu/apps/newakhilesh

echo ""
echo "========================================"
echo "  A.NANDA V2 SERVER — FIRST TIME SETUP"
echo "========================================"
echo ""

# Create logs directory
mkdir -p /home/ubuntu/logs

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install API dependencies
echo "Installing portfolio-api-v2 dependencies..."
cd $ROOT/server/portfolio-api
npm install

# Create .env from example if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "========================================"
    echo "  ACTION REQUIRED:"
    echo "  Edit your API keys in .env file:"
    echo "  nano $ROOT/server/portfolio-api/.env"
    echo "========================================"
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update -q
    sudo apt-get install -y nginx
fi

# Copy Nginx V2 config
sudo cp $ROOT/nginx/portfolio-v2.conf /etc/nginx/sites-available/portfolio-v2
sudo ln -sf /etc/nginx/sites-available/portfolio-v2 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "========================================"
echo "  SETUP COMPLETE!"
echo ""
echo "  Next steps:"
echo "  1. Edit .env: nano $ROOT/server/portfolio-api/.env"
echo "  2. Build frontend: cd $ROOT/frontend && npm install && npm run build"
echo "  3. Start API: cd $ROOT/server/portfolio-api && pm2 start ecosystem.config.js"
echo "  4. Save PM2:  pm2 save && pm2 startup"
echo "  5. Check API: curl http://localhost:3002/health"
echo "========================================"
