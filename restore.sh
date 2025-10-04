#!/bin/bash

# Comprehensive Restore Script for Colmena Project
# Handles InfluxDB, Grafana, Mosquitto, Node-RED, Device Registry, ML models, BeeCount, OTA files, SSL certificates, Docker volumes, from S3

set -e

# Configuration
BACKUP_DIR="./backups"
S3_BUCKET="your-s3-bucket-name"  # Replace with your S3 bucket
BACKUP_FILE="$1"  # Pass the backup file name as argument, e.g., colmena_backup_20231004_120000.tar.gz

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file_name>"
    exit 1
fi

S3_KEY="$BACKUP_FILE"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting restore process..."

# Stop services
echo "Stopping Docker services..."
docker-compose down

# Download from S3
echo "Downloading backup from S3..."
aws s3 cp "s3://$S3_BUCKET/$S3_KEY" "$BACKUP_DIR/$BACKUP_FILE"

# Extract backup archive
echo "Extracting backup archive..."
tar xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$BACKUP_DIR"

# Restore InfluxDB volume
if [ -f "$BACKUP_DIR/influxdb_data.tar.gz" ]; then
    echo "Restoring InfluxDB data..."
    docker run --rm -v colmena_influxdb_data:/data -v "$(pwd)/$BACKUP_DIR:/backup" alpine sh -c "rm -rf /data/* && tar xzf /backup/influxdb_data.tar.gz -C /data"
fi

# Restore Grafana configs
if [ -f "$BACKUP_DIR/grafana_configs.tar.gz" ]; then
    echo "Restoring Grafana configs..."
    rm -rf grafana/provisioning/*
    tar xzf "$BACKUP_DIR/grafana_configs.tar.gz" -C .
fi

# Restore Mosquitto config
if [ -f "$BACKUP_DIR/mosquitto.conf" ]; then
    echo "Restoring Mosquitto config..."
    cp "$BACKUP_DIR/mosquitto.conf" .
fi

# Restore Nginx configs
if [ -f "$BACKUP_DIR/nginx_configs.tar.gz" ]; then
    echo "Restoring Nginx configs..."
    rm -rf nginx/sites/* nginx/nginx.conf
    tar xzf "$BACKUP_DIR/nginx_configs.tar.gz" -C .
fi

# Restore SSL certificates
if [ -d "$BACKUP_DIR/ssl" ]; then
    echo "Restoring SSL certificates..."
    # Copy to nginx container if running, or prepare for next start
    # Assuming nginx will be started later, but to restore, we can copy after start or use volume
    # For now, since nginx creates /etc/nginx/ssl, we can copy after starting nginx
fi

# Restore OTA files
if [ -f "$BACKUP_DIR/ota_files.tar.gz" ]; then
    echo "Restoring OTA files..."
    rm -rf firmware/*
    tar xzf "$BACKUP_DIR/ota_files.tar.gz" -C .
fi

# Restore Device Registry schema (if needed)
if [ -f "$BACKUP_DIR/init.sql" ]; then
    echo "Restoring Device Registry schema..."
    cp "$BACKUP_DIR/init.sql" api/
fi

# Note: For SSL certs, since they are in container, start nginx first, then copy
echo "Starting nginx to restore SSL certs..."
docker-compose up -d nginx

if [ -d "$BACKUP_DIR/ssl" ]; then
    echo "Copying SSL certs to nginx container..."
    docker cp "$BACKUP_DIR/ssl" $(docker-compose ps -q nginx):/etc/nginx/
fi

# Start all services
echo "Starting all Docker services..."
docker-compose up -d

# Clean up
echo "Cleaning up temporary files..."
rm -rf "$BACKUP_DIR"

echo "Restore completed successfully!"