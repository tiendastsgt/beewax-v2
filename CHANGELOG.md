# Changelog

## v2.0.0 (2024-01-15)

**Features:**
- Integrated BeeCount module (OpenCV & YOLO support).
- Implemented ML Ensemble Anomaly Detector service.
- Full API routes for Hive Management (Telemetry, Alerts, System, OTA).
- PostgreSQL Device Registry schema finalized (including command_history).
- Complete Docker Swarm/Compose definitions with resource limits.
- Full Nginx configuration with TLS, HSTS, and security headers.

**Fixes:**
- Patched Mosquitto healthcheck command.
- Corrected Grafana provisioning process using `envsubst` for secure token injection.

## v1.0.0 (Initial Release)

- Core sensor telemetry stack (InfluxDB, Grafana, Mosquitto).
- Basic API structure.