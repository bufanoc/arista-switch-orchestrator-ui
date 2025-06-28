
# Arista Lab Switch Manager

## Overview

The Arista Lab Switch Manager is a comprehensive web-based network configuration and management platform designed for Arista switches in laboratory environments. Built with modern web technologies, it provides an intuitive interface for managing VLANs, VXLANs, and network tunnels.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Dashboard  │ │ VLAN Manager│ │VXLAN Manager│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Switch Dialog│ │ CLI Diff    │ │Tunnel Wizard│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│           State Management & Business Logic                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    React    │ │   Hooks     │ │  Utilities  │           │
│  │    State    │ │   Context   │ │  Functions  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Network Layer                              │
├─────────────────────────────────────────────────────────────┤
│              Arista Switch Infrastructure                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   EOS API   │ │   eAPI      │ │    CLI      │           │
│  │  Interface  │ │  Connector  │ │  Commands   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies
- **React 18** - Modern component-based UI framework
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Beautiful icon library
- **Recharts** - Chart and graph visualization

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - CSS vendor prefix automation

## Entity Relationship Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│      VLAN       │      │      VXLAN      │      │     Switch      │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ id: string      │      │ id: string      │      │ id: string      │
│ vlanId: number  │      │ vni: number     │      │ name: string    │
│ name: string    │      │ name: string    │      │ ip: string      │
│ description: str│      │ vlan: string    │      │ model: string   │
│ status: enum    │      │ status: enum    │      │ version: string │
│ switches: arr[] │◄────┐│ switches: arr[] │◄────┐│ status: enum    │
└─────────────────┘     ││ vtepIp: string  │     ││ lastSeen: date  │
         │              │└─────────────────┘     │└─────────────────┘
         │              │          │             │          │
         ▼              │          ▼             │          ▼
┌─────────────────┐     │┌─────────────────┐     │┌─────────────────┐
│   VLANSwitch    │     ││  VXLANSwitch    │     ││   SwitchPort    │
├─────────────────┤     │├─────────────────┤     │├─────────────────┤
│ vlanId: string  │─────┘│ vxlanId: string │─────┘│ switchId: string│
│ switchId: string│      │ switchId: string│      │ portName: string│
│ ports: string[] │      │ vtepIp: string  │      │ portType: enum  │
│ tagged: boolean │      │ mcastGroup: str │      │ status: enum    │
└─────────────────┘      └─────────────────┘      │ speed: string   │
                                                  │ duplex: enum    │
                                                  └─────────────────┘
```

## Installation

### Automated Installation (Ubuntu 22.04.5 LTS)

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/your-org/arista-switch-manager/main/install.sh | bash

# Or clone and run locally
git clone https://github.com/your-org/arista-switch-manager.git
cd arista-switch-manager
chmod +x install.sh
sudo ./install.sh
```

### Manual Installation Steps

#### Prerequisites
- Ubuntu 22.04.5 LTS Server
- Node.js 20.x or later
- npm 10.x or later
- Git
- Build essentials

#### Step 1: System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional dependencies
sudo apt install -y git build-essential nginx
```

#### Step 2: Application Setup
```bash
# Create application directory
sudo mkdir -p /opt/arista-switch-manager
sudo chown $USER:$USER /opt/arista-switch-manager
cd /opt/arista-switch-manager

# Clone repository
git clone https://github.com/your-org/arista-switch-manager.git .

# Install dependencies
npm install

# Build application
npm run build
```

#### Step 3: Service Configuration
```bash
# Create systemd service
sudo cp scripts/arista-switch-manager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable arista-switch-manager
sudo systemctl start arista-switch-manager
```

#### Step 4: Nginx Configuration
```bash
# Configure reverse proxy
sudo cp scripts/nginx.conf /etc/nginx/sites-available/arista-switch-manager
sudo ln -s /etc/nginx/sites-available/arista-switch-manager /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## Example CLI Configuration Diffs

### VLAN Creation Example
```diff
Current Configuration:
!
vlan 1
   name default
!

Proposed Changes:
!
vlan 1
   name default
!
+ vlan 100
+    name Production
+    state active
+ !
+ vlan 200
+    name Development
+    state active
!
```

### VXLAN Configuration Example
```diff
Current Configuration:
!
interface Vxlan1
!

Proposed Changes:
!
interface Vxlan1
+    vxlan source-interface Loopback1
+    vxlan udp-port 4789
+    vxlan vlan 100 vni 10100
+    vxlan vlan 200 vni 10200
+    vxlan flood vtep 192.168.1.1 192.168.1.2
!
```

### Switch Interface Configuration
```diff
Current Configuration:
!
interface Ethernet1
   switchport mode access
!

Proposed Changes:
!
interface Ethernet1
-    switchport mode access
+    switchport mode trunk
+    switchport trunk allowed vlan 100,200
+    spanning-tree portfast
!
```

## Log Locations and Monitoring

### Application Logs
```bash
# Main application logs
/var/log/arista-switch-manager/app.log
/var/log/arista-switch-manager/error.log
/var/log/arista-switch-manager/access.log

# Installation logs
/var/log/arista-switch-manager/install.log

# System service logs
journalctl -u arista-switch-manager -f

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### Monitoring Commands
```bash
# Check application status
sudo systemctl status arista-switch-manager

# View real-time logs
tail -f /var/log/arista-switch-manager/app.log

# Monitor system resources
htop
df -h
free -h

# Check network connectivity
ss -tulpn | grep :8080
netstat -tulpn | grep nginx
```

## Development

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/arista-switch-manager.git
cd arista-switch-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── VLANManager.tsx # VLAN management
│   ├── VXLANManager.tsx# VXLAN management
│   └── ...
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript definitions
```

## Configuration

### Environment Variables
```bash
# Application settings
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Arista switch connection
ARISTA_USERNAME=admin
ARISTA_PASSWORD=password
ARISTA_ENABLE_PASSWORD=enable

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/arista-switch-manager
```

### Switch Configuration
Edit `config/switches.json` to configure your Arista switches:
```json
{
  "switches": [
    {
      "name": "leaf-01",
      "ip": "192.168.1.10",
      "model": "DCS-7050SX3-48YC8",
      "username": "admin",
      "password": "password"
    }
  ]
}
```

## API Documentation

### Switch Management Endpoints
- `GET /api/switches` - List all switches
- `POST /api/switches` - Add new switch
- `PUT /api/switches/:id` - Update switch
- `DELETE /api/switches/:id` - Remove switch

### VLAN Management Endpoints
- `GET /api/vlans` - List all VLANs
- `POST /api/vlans` - Create new VLAN
- `PUT /api/vlans/:id` - Update VLAN
- `DELETE /api/vlans/:id` - Delete VLAN

### VXLAN Management Endpoints
- `GET /api/vxlans` - List all VXLANs
- `POST /api/vxlans` - Create new VXLAN
- `PUT /api/vxlans/:id` - Update VXLAN
- `DELETE /api/vxlans/:id` - Delete VXLAN

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service status
sudo systemctl status arista-switch-manager

# Check logs
journalctl -u arista-switch-manager -n 50

# Restart service
sudo systemctl restart arista-switch-manager
```

#### Connection Issues
```bash
# Test switch connectivity
ping 192.168.1.10

# Check port accessibility
telnet 192.168.1.10 443

# Verify credentials
curl -k -u admin:password https://192.168.1.10/command-api
```

#### Performance Issues
```bash
# Monitor system resources
htop
iotop
nethogs

# Check disk space
df -h

# Analyze logs
grep ERROR /var/log/arista-switch-manager/app.log
```

## Security Considerations

- Change default passwords for all switches
- Use HTTPS in production environments
- Implement proper firewall rules
- Regular security updates
- Monitor access logs
- Use strong authentication mechanisms

## Support and Contributing

### Getting Help
- Check the troubleshooting section
- Review log files for error messages
- Open an issue on GitHub
- Contact the development team

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### Version 1.0.0 (2025-06-28)
- Initial release
- VLAN management functionality
- VXLAN management functionality
- Switch inventory management
- Dashboard with monitoring
- CLI diff viewer
- Tunnel wizard

---

For more information, visit the [project repository](https://github.com/your-org/arista-switch-manager) or contact the development team.
