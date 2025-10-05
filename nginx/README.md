# Nginx Configuration for BeeWax System

## Architecture Overview

```
Internet → Nginx (SSL termination) → API Backend (port 8080)
                                      ↘ OTA Server (static files)
                                      ↘ Grafana (port 3000)
```

## Configuration Files

### Main Configuration
- `nginx.conf` - Base configuration with upstream definitions

### Virtual Hosts
- `sites/api.beewax.shop.conf` - API server with SSL/TLS and WebSocket
- `sites/ota.beewax.shop.conf` - OTA server with static file serving
- `sites/grafana.beewax.shop.conf` - Grafana dashboard server

## Upstream Configuration

### api_backend
- Target: `api:8080` (API service container)
- Keepalive: 32 connections
- Used by: API server, OTA server (for API endpoints)

## SSL/TLS Configuration

### Certificates
All certificates stored in `nginx/ssl/` directory:
- `api.beewax.shop.{crt,key}` - API server
- `ota.beewax.shop.{crt,key}` - OTA server
- `grafana.beewax.shop.{crt,key}` - Grafana server

### Security Settings
- TLSv1.2 and TLSv1.3 only
- Perfect Forward Secrecy enabled
- HSTS with preload
- Comprehensive security headers
- CSP with strict policies

## Proxy Configurations

### API Server
- HTTP to HTTPS redirect
- WebSocket support for real-time communications
- Timeout and buffer optimizations
- CORS headers for cross-origin requests

### OTA Server
- Static file serving for firmware binaries
- Cache headers for firmware files (1 hour)
- API proxy for firmware metadata
- Health check endpoint at `/fw/health`

## Troubleshooting

### Common Issues
1. **Upstream Not Found**: Ensure upstream is defined in nginx.conf
2. **SSL Certificate Errors**: Check certificate paths and permissions
3. **Proxy Connection Refused**: Verify backend services are running
4. **502 Bad Gateway**: Check backend service logs for errors

### Health Checks
- API: `GET /health`
- OTA: `GET /fw/health`
- Grafana: `GET /api/health`

## Performance Optimization

### Buffer Settings
- Proxy buffering enabled
- 4KB buffer size
- 4-8 buffers per connection

### Timeouts
- Connect: 60s (API), 30s (OTA)
- Send: 60s (API), 30s (OTA)
- Read: 60s (API), 30s (OTA)
- WebSocket: 24 hours