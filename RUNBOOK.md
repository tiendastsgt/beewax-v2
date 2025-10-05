# BeeWax Monitoring System Runbook (v2.0)

## 1. Deployment and Startup

*Reference setup.sh and install.sh.*

## 2. Health Monitoring and Diagnostics

Check services health via Nginx: `curl https://api.beewax.shop/health`

*Reference: monitoring/health_check.sh*

## 3. Maintenance Procedures

### 3.1 Backup and Restore

*Reference: backups/backup.sh and backups/restore.sh*

### 3.2 Firmware Updates (OTA)

*Process: API call -> MQTT command -> device execution -> status update in DB.*

## 4. Troubleshooting and Recovery

*Reference: docs/troubleshooting.md*