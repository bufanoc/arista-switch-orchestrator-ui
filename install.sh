
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

# Install application dependencies
if [ -f "package.json" ]; then
    log "${BLUE}Installing application dependencies...${NC}"
    npm install
else
    log "${YELLOW}No package.json found. Application code needs to be deployed.${NC}"
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
ExecStart=/usr/bin/npm run dev
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
log "${GREEN}Service created and enabled${NC}"

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

log "${GREEN}================================================${NC}"
log "${GREEN}Installation completed successfully!${NC}"
log "${GREEN}================================================${NC}"
log ""
log "${BLUE}Next Steps:${NC}"
log "1. Deploy your application code to: $APP_DIR"
log "2. Start the service: sudo systemctl start arista-switch-manager"
log "3. Check service status: sudo systemctl status arista-switch-manager"
log "4. Access the application: http://your-server-ip"
log ""
log "${BLUE}Log Locations:${NC}"
log "- Installation log: $INSTALL_LOG"
log "- Application logs: $LOG_DIR/app.log"
log "- Nginx logs: /var/log/nginx/"
log "- System logs: journalctl -u arista-switch-manager"
log ""
log "${BLUE}Useful Commands:${NC}"
log "- View logs: tail -f $INSTALL_LOG"
log "- Restart service: sudo systemctl restart arista-switch-manager"
log "- Check Nginx: sudo nginx -t"
log "- Monitor processes: pm2 status"

exit 0
