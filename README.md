# BeeWax Hive Monitoring System

## Quick Installation Guide

1. **Requirements**: Linux (Ubuntu 20.04+), Docker, Docker Compose, 4GB RAM minimum.

2. **Installation**:

```bash
chmod +x setup.sh
sudo ./setup.sh
```

3. **Configuration**:

```bash
sudo nano /etc/beewax/.env
```

4. **Start**:

```bash
sudo systemctl start beewax
```

5. **Access**:

- Grafana: http://localhost:3000 (admin/password)
- Node-RED: http://localhost:1880

## BeeCount Module (Traffic Analysis)

Configure your cameras in `beecount/app/roi_config.yaml` to monitor bee traffic. The system will automatically count bees entering and exiting each hive.

## Support

For technical support, contact support@beewax.shop or consult the full documentation.