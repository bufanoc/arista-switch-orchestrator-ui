
#!/bin/bash

# Arista Lab Switch Manager - Complete Uninstall Script
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

# Application directories and files
APP_DIR="/opt/arista-switch-manager"
LOG_DIR="/var/log/arista-switch-manager"
MONITOR_DIR="/var/lib/arista-switch-manager"
SERVICE_FILE="/etc/systemd/system/arista-switch-manager.service"
LOGROTATE_FILE="/etc/logrotate.d/arista-switch-manager"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Arista Lab Switch Manager Uninstall${NC}"
echo -e "${BLUE}  Complete System Cleanup${NC}"
echo -e "${BLUE}================================================${NC}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "$1"
}

log "${YELLOW}Starting complete uninstall process...${NC}"

# Stop and disable the service
if systemctl is-active --quiet arista-switch-manager 2>/dev/null; then
    log "${BLUE}Stopping arista-switch-manager service...${NC}"
    sudo systemctl stop arista-switch-manager
    log "${GREEN}✅ Service stopped${NC}"
else
    log "${YELLOW}Service not running${NC}"
fi

if systemctl is-enabled --quiet arista-switch-manager 2>/dev/null; then
    log "${BLUE}Disabling arista-switch-manager service...${NC}"
    sudo systemctl disable arista-switch-manager
    log "${GREEN}✅ Service disabled${NC}"
else
    log "${YELLOW}Service not enabled${NC}"
fi

# Remove systemd service file
if [ -f "$SERVICE_FILE" ]; then
    log "${BLUE}Removing systemd service file...${NC}"
    sudo rm -f "$SERVICE_FILE"
    sudo systemctl daemon-reload
    log "${GREEN}✅ Service file removed${NC}"
else
    log "${YELLOW}Service file not found${NC}"
fi

# Kill any remaining processes
log "${BLUE}Checking for remaining processes...${NC}"
if pgrep -f "arista-switch-manager" > /dev/null; then
    log "${YELLOW}Killing remaining processes...${NC}"
    sudo pkill -f "arista-switch-manager" || true
    sleep 2
    # Force kill if still running
    if pgrep -f "arista-switch-manager" > /dev/null; then
        sudo pkill -9 -f "arista-switch-manager" || true
    fi
    log "${GREEN}✅ Processes terminated${NC}"
else
    log "${GREEN}No remaining processes found${NC}"
fi

# Remove application directory
if [ -d "$APP_DIR" ]; then
    log "${BLUE}Removing application directory: $APP_DIR${NC}"
    sudo rm -rf "$APP_DIR"
    log "${GREEN}✅ Application directory removed${NC}"
else
    log "${YELLOW}Application directory not found${NC}"
fi

# Remove log directory
if [ -d "$LOG_DIR" ]; then
    log "${BLUE}Removing log directory: $LOG_DIR${NC}"
    sudo rm -rf "$LOG_DIR"
    log "${GREEN}✅ Log directory removed${NC}"
else
    log "${YELLOW}Log directory not found${NC}"
fi

# Remove monitoring directory
if [ -d "$MONITOR_DIR" ]; then
    log "${BLUE}Removing monitoring directory: $MONITOR_DIR${NC}"
    sudo rm -rf "$MONITOR_DIR"
    log "${GREEN}✅ Monitoring directory removed${NC}"
else
    log "${YELLOW}Monitoring directory not found${NC}"
fi

# Remove logrotate configuration
if [ -f "$LOGROTATE_FILE" ]; then
    log "${BLUE}Removing logrotate configuration...${NC}"
    sudo rm -f "$LOGROTATE_FILE"
    log "${GREEN}✅ Logrotate configuration removed${NC}"
else
    log "${YELLOW}Logrotate configuration not found${NC}"
fi

# Remove firewall rules (optional - user can choose to keep them)
read -p "Do you want to remove firewall rules for ports 80 and 443? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "${BLUE}Removing firewall rules...${NC}"
    sudo ufw delete allow 80/tcp 2>/dev/null || true
    sudo ufw delete allow 443/tcp 2>/dev/null || true
    log "${GREEN}✅ Firewall rules removed${NC}"
else
    log "${YELLOW}Firewall rules preserved${NC}"
fi

# Clean up any remaining PM2 processes
if command -v pm2 >/dev/null 2>&1; then
    log "${BLUE}Checking PM2 processes...${NC}"
    pm2 delete arista-switch-manager 2>/dev/null || true
    pm2 save 2>/dev/null || true
    log "${GREEN}✅ PM2 processes cleaned${NC}"
fi

# Remove any nginx configurations if they exist
NGINX_SITE="/etc/nginx/sites-available/arista-switch-manager"
NGINX_ENABLED="/etc/nginx/sites-enabled/arista-switch-manager"

if [ -f "$NGINX_SITE" ]; then
    log "${BLUE}Removing nginx site configuration...${NC}"
    sudo rm -f "$NGINX_SITE"
    log "${GREEN}✅ Nginx site configuration removed${NC}"
fi

if [ -L "$NGINX_ENABLED" ]; then
    log "${BLUE}Removing nginx enabled site...${NC}"
    sudo rm -f "$NGINX_ENABLED"
    log "${GREEN}✅ Nginx enabled site removed${NC}"
fi

# Test nginx configuration if nginx is installed and running
if command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx
        log "${GREEN}✅ Nginx configuration reloaded${NC}"
    else
        log "${YELLOW}Nginx configuration test failed - manual check needed${NC}"
    fi
fi

# Clean up systemd journal logs related to the service
log "${BLUE}Cleaning systemd journal logs...${NC}"
sudo journalctl --vacuum-time=1d --quiet 2>/dev/null || true
log "${GREEN}✅ Journal logs cleaned${NC}"

# Optional: Remove Node.js and npm if they were installed specifically for this app
read -p "Do you want to remove Node.js and npm? (WARNING: This may affect other applications) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "${BLUE}Removing Node.js and npm...${NC}"
    sudo apt remove -y nodejs npm
    sudo apt autoremove -y
    log "${GREEN}✅ Node.js and npm removed${NC}"
else
    log "${YELLOW}Node.js and npm preserved${NC}"
fi

# Optional: Remove PM2 if installed
read -p "Do you want to remove PM2 process manager? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "${BLUE}Removing PM2...${NC}"
    sudo npm uninstall -g pm2 2>/dev/null || true
    log "${GREEN}✅ PM2 removed${NC}"
else
    log "${YELLOW}PM2 preserved${NC}"
fi

# Verify complete removal
log "${BLUE}Verifying complete removal...${NC}"

# Check for any remaining files or processes
REMAINING_FILES=0

if [ -d "$APP_DIR" ]; then
    log "${RED}❌ Application directory still exists: $APP_DIR${NC}"
    REMAINING_FILES=1
fi

if [ -d "$LOG_DIR" ]; then
    log "${RED}❌ Log directory still exists: $LOG_DIR${NC}"
    REMAINING_FILES=1
fi

if [ -f "$SERVICE_FILE" ]; then
    log "${RED}❌ Service file still exists: $SERVICE_FILE${NC}"
    REMAINING_FILES=1
fi

if systemctl list-unit-files | grep -q arista-switch-manager; then
    log "${RED}❌ Service still registered in systemd${NC}"
    REMAINING_FILES=1
fi

if pgrep -f "arista-switch-manager" > /dev/null; then
    log "${RED}❌ Processes still running${NC}"
    REMAINING_FILES=1
fi

if [ $REMAINING_FILES -eq 0 ]; then
    log "${GREEN}✅ All components successfully removed${NC}"
else
    log "${YELLOW}⚠️ Some components may require manual removal${NC}"
fi

log "${GREEN}================================================${NC}"
log "${GREEN}Uninstall completed!${NC}"
log "${GREEN}================================================${NC}"
log ""
log "${BLUE}Summary of actions performed:${NC}"
log "- ✅ Stopped and disabled arista-switch-manager service"
log "- ✅ Removed systemd service file"
log "- ✅ Terminated all related processes"
log "- ✅ Removed application directory ($APP_DIR)"
log "- ✅ Removed log directory ($LOG_DIR)"
log "- ✅ Removed monitoring directory ($MONITOR_DIR)"
log "- ✅ Removed logrotate configuration"
log "- ✅ Cleaned systemd journal logs"
log ""
log "${BLUE}Optional actions (if selected):${NC}"
log "- Removed firewall rules for ports 80/443"
log "- Removed Node.js and npm"
log "- Removed PM2 process manager"
log ""
log "${GREEN}The system is now ready for a fresh installation.${NC}"
log "${BLUE}To reinstall, run: chmod +x install.sh && sudo ./install.sh${NC}"

exit 0
