#!/bin/bash

echo "==================================================="
echo "  Lyve <-> HikCentral Middleware (Ubuntu Deployment)"
echo "==================================================="

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18+ recommended):"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "[WARNING] .env file not found! Creating default from template..."
    echo "PORT=3000" > .env
    echo "HIKCENTRAL_BASE_URL=https://YOUR_HIKCENTRAL_IP:443" >> .env
    echo "HIKCENTRAL_APP_KEY=your_app_key" >> .env
    echo "HIKCENTRAL_APP_SECRET=your_app_secret" >> .env
    echo "HIKCENTRAL_USER_ID=admin" >> .env
    echo "HIKCENTRAL_VERIFY_SSL=false" >> .env
    echo "[INFO] .env created. PLEASE EDIT IT with actual credentials."
fi

# 3. Install Dependencies
echo "[INFO] Installing/Updating dependencies..."
npm install

# 4. Start Server
echo "---------------------------------------------------"
echo "[INFO] Starting Server..."

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "[INFO] PM2 detected. Starting process..."
    pm2 delete hik-middleware 2>/dev/null || true
    pm2 start server.js --name "hik-middleware"
    echo "[SUCCESS] App is running in background (PM2)."
    echo "Use 'pm2 logs' to see output."
else
    echo "[INFO] PM2 not found. Running in foreground."
    echo "Tip: Install PM2 for background execution (npm install -g pm2)"
    echo "---------------------------------------------------"
    node server.js
fi
