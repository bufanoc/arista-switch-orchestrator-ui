
#!/bin/bash

# Arista Lab Switch Manager - Ubuntu 22.04.5 Server Installation Script
# Author: Arista Networks Lab Team
# Version: 1.0
# Date: 2025-06-28

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging setup
LOG_DIR="/var/log/arista-switch-manager"
INSTALL_LOG="$LOG_DIR/install.log"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Arista Lab Switch Manager Installation${NC}"
echo -e "${BLUE}  Ubuntu 22.04.5 LTS Server${NC}"
echo -e "${BLUE}================================================${NC}"

# Create log directory
sudo mkdir -p $LOG_DIR
sudo touch $INSTALL_LOG

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a $INSTALL_LOG
    echo -e "$1"
}

log "${GREEN}Starting installation process...${NC}"

# Check Ubuntu version
if ! grep -q "22.04.5" /etc/os-release; then
    log "${YELLOW}Warning: This script is optimized for Ubuntu 22.04.5 LTS${NC}"
fi

# Update system packages
log "${BLUE}Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
log "${BLUE}Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "${GREEN}Node.js installed: $NODE_VERSION${NC}"
log "${GREEN}npm installed: $NPM_VERSION${NC}"

# Install Git
log "${BLUE}Installing Git...${NC}"
sudo apt install -y git

# Install build essentials
log "${BLUE}Installing build essentials...${NC}"
sudo apt install -y build-essential

# Install PM2 for process management
log "${BLUE}Installing PM2 process manager...${NC}"
sudo npm install -g pm2

# Install Nginx for reverse proxy
log "${BLUE}Installing Nginx...${NC}"
sudo apt install -y nginx

# Configure firewall
log "${BLUE}Configuring UFW firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable

# Create application directory
APP_DIR="/opt/arista-switch-manager"
log "${BLUE}Creating application directory: $APP_DIR${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or setup application
cd $APP_DIR
if [ ! -d ".git" ]; then
    log "${BLUE}Initializing application directory...${NC}"
    git init
fi

# Check if application code exists
if [ -f "package.json" ]; then
    log "${BLUE}Installing application dependencies...${NC}"
    npm install
    
    # Build the application if build script exists
    if npm run build 2>/dev/null; then
        log "${GREEN}Application built successfully${NC}"
    else
        log "${YELLOW}Build script not available or failed${NC}"
    fi
else
    log "${YELLOW}No package.json found. Creating placeholder application...${NC}"
    
    # Create a simple Node.js server as placeholder
    cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Arista Switch Manager - Setup Required</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .status { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .steps { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Arista Lab Switch Manager</h1>
        <div class="status">
            <strong>⚠️ Setup Required</strong><br>
            The server infrastructure is ready, but the React application needs to be deployed.
        </div>
        <div class="steps">
            <h3>Next Steps:</h3>
            <ol>
                <li>Deploy your React application code to: <code>/opt/arista-switch-manager</code></li>
                <li>Run: <code>sudo systemctl start arista-switch-manager</code></li>
                <li>Check status: <code>sudo systemctl status arista-switch-manager</code></li>
            </ol>
        </div>
        <p><strong>Server Status:</strong> ✅ Infrastructure Ready</p>
        <p><strong>Port:</strong> 8080</p>
        <p><strong>Logs:</strong> <code>/var/log/arista-switch-manager/</code></p>
    </div>
</body>
</html>
        `);
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'placeholder', message: 'Waiting for application deployment' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Placeholder server running on port ${PORT}`);
});
EOF
    
    # Create package.json for the placeholder
    cat > package.json << 'EOF'
{
  "name": "arista-switch-manager-placeholder",
  "version": "1.0.0",
  "description": "Placeholder server for Arista Switch Manager",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  }
}
EOF
fi

# Create systemd service
log "${BLUE}Creating systemd service...${NC}"
sudo tee /etc/systemd/system/arista-switch-manager.service > /dev/null <<EOF
[Unit]
Description=Arista Lab Switch Manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable arista-switch-manager
sudo systemctl start arista-switch-manager
log "${GREEN}Service created, enabled, and started${NC}"

# Configure Nginx reverse proxy
log "${BLUE}Configuring Nginx reverse proxy...${NC}"
sudo tee /etc/nginx/sites-available/arista-switch-manager > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/arista-switch-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Create log rotation
log "${BLUE}Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/arista-switch-manager > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Set up monitoring directory
MONITOR_DIR="/var/lib/arista-switch-manager"
sudo mkdir -p $MONITOR_DIR
sudo chown $USER:$USER $MONITOR_DIR

# Wait a moment for service to start
sleep 3

# Check if service is running
if systemctl is-active --quiet arista-switch-manager; then
    log "${GREEN}✅ Service is running${NC}"
    
    # Test the endpoint
    if curl -s http://localhost:8080/health > /dev/null; then
        log "${GREEN}✅ Application is responding${NC}"
    else
        log "${YELLOW}⚠️ Service running but not responding${NC}"
    fi
else
    log "${RED}❌ Service failed to start${NC}"
    log "${YELLOW}Check logs: journalctl -u arista-switch-manager -n 20${NC}"
fi

log "${GREEN}================================================${NC}"
log "${GREEN}Installation completed successfully!${NC}"
log "${GREEN}================================================${NC}"
log ""
log "${BLUE}Access your application:${NC}"
log "🌐 URL: http://$(hostname -I | awk '{print $1}')"
log "🌐 Local: http://localhost"
log ""
log "${BLUE}Next Steps:${NC}"
if [ ! -f "$APP_DIR/src/main.tsx" ]; then
    log "${YELLOW}1. Deploy your React application code to: $APP_DIR${NC}"
    log "${YELLOW}2. Install dependencies: cd $APP_DIR && npm install${NC}"
    log "${YELLOW}3. Build application: npm run build${NC}"
    log "${YELLOW}4. Restart service: sudo systemctl restart arista-switch-manager${NC}"
else
    log "1. Check service status: sudo systemctl status arista-switch-manager"
    log "2. View logs: journalctl -u arista-switch-manager -f"
fi
log ""
log "${BLUE}Log Locations:${NC}"
log "- Installation log: $INSTALL_LOG"
log "- Application logs: journalctl -u arista-switch-manager"
log "- Nginx logs: /var/log/nginx/"
log ""
log "${BLUE}Useful Commands:${NC}"
log "- View logs: tail -f $INSTALL_LOG"
log "- Restart service: sudo systemctl restart arista-switch-manager"
log "- Check Nginx: sudo nginx -t"
log "- Service status: sudo systemctl status arista-switch-manager"

exit 0
