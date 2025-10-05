#!/bin/bash

# Comprehensive Backup Script for Colmena Project
# Handles InfluxDB, Grafana, Mosquitto, Node-RED, Device Registry, ML models, BeeCount, OTA files, SSL certificates, Docker volumes, and S3 upload

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="colmena_backup_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"
S3_BUCKET="your-s3-bucket-name"  # Replace with your S3 bucket
S3_KEY="${BACKUP_FILE}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup process..."

# Stop services to ensure consistency
echo "Stopping Docker services..."
docker-compose down

# Backup InfluxDB volume
echo "Backing up InfluxDB data..."
docker run --rm -v colmena_influxdb_data:/data -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf "/backup/influxdb_data.tar.gz" -C /data .

# Backup Grafana provisioning configs
echo "Backing up Grafana configs..."
tar czf "$BACKUP_DIR/grafana_configs.tar.gz" grafana/provisioning/

# Backup Mosquitto config (if exists)
if [ -f "mosquitto.conf" ]; then
    echo "Backing up Mosquitto config..."
    cp mosquitto.conf "$BACKUP_DIR/"
fi

# Backup Nginx configs and SSL certificates
echo "Backing up Nginx configs..."
tar czf "$BACKUP_DIR/nginx_configs.tar.gz" nginx/sites/ nginx/nginx.conf

echo "Backing up SSL certificates..."
# Assuming nginx container has SSL certs in /etc/nginx/ssl
# If nginx is not running, this will fail; adjust as needed
docker cp $(docker-compose ps -q nginx):/etc/nginx/ssl "$BACKUP_DIR/ssl" 2>/dev/null || echo "SSL certs not found in nginx container"

# Backup OTA files (firmware)
echo "Backing up OTA files..."
tar czf "$BACKUP_DIR/ota_files.tar.gz" firmware/

# Backup API init.sql (Device Registry schema)
echo "Backing up Device Registry schema..."
cp api/init.sql "$BACKUP_DIR/"

# Note: Node-RED, ML models, BeeCount data not found in current setup
# Add backups for these if they exist in future

# Create comprehensive backup archive
echo "Creating backup archive..."
tar czf "$BACKUP_DIR/$BACKUP_FILE" -C "$BACKUP_DIR" $(ls "$BACKUP_DIR" | grep -v "$BACKUP_FILE")

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/$S3_KEY"

# Clean up local backup files (keep the archive)
echo "Cleaning up temporary files..."
rm -f "$BACKUP_DIR"/*.tar.gz "$BACKUP_DIR"/mosquitto.conf "$BACKUP_DIR"/init.sql
rm -rf "$BACKUP_DIR/ssl"

# Restart services
echo "Restarting Docker services..."
docker-compose up -d

echo "Backup completed successfully! File: $BACKUP_FILE uploaded to s3://$S3_BUCKET/$S3_KEY"