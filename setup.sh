#!/bin/bash

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then print_error "Run as root"; exit 1; fi

print_status "Starting BeeWax installation..."
PROJECT_NAME="beewax-monitoring"; INSTALL_DIR="/opt/$PROJECT_NAME"

# Check Docker
if ! command -v docker &> /dev/null; then
print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh; sh get-docker.sh; rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then

print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
fi

# Create directories
mkdir -p "$INSTALL_DIR" "/var/log/beewax" "/etc/beewax"
cp -r . "$INSTALL_DIR/"
cp "$INSTALL_DIR/.env.example" "/etc/beewax/.env"

# Set permissions
chown -R root:root "$INSTALL_DIR"
chmod +x "$INSTALL_DIR"/*.sh
useradd -r -s /bin/false beewax || true
chown -R beewax:beewax /var/log/beewax

# Generate SSL
mkdir -p "$INSTALL_DIR/nginx/ssl"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$INSTALL_DIR/nginx/ssl/api.beewax.shop.key" -out "$INSTALL_DIR/nginx/ssl/api.beewax.shop.crt" -subj "/C=GT/ST=Guatemala/L=Guatemala/CN=api.beewax.shop"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$INSTALL_DIR/nginx/ssl/grafana.beewax.shop.key" -out "$INSTALL_DIR/nginx/ssl/grafana.beewax.shop.crt" -subj "/C=GT/ST=Guatemala/L=Guatemala/CN=grafana.beewax.shop"

# Systemd service
cat > /etc/systemd/system/beewax.service << EOF
[Unit]
Description=BeeWax Hive Monitoring System
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload; systemctl enable beewax

# Cron jobs
(crontab -l 2>/dev/null; echo "0 2 * * 0 $INSTALL_DIR/backups/backup.sh >> /var/log/beewax/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "*/15 * * * * $INSTALL_DIR/monitoring/health_check.sh >> /var/log/beewax/health.log 2>&1") | crontab -

print_success "Installation complete!"
print_status "Next: 1. nano /etc/beewax/.env 2. systemctl start beewax 3. http://localhost:3000"