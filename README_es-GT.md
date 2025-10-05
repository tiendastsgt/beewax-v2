# BeeWax – Sistema de Monitoreo de Colmenas

## Guía Rápida de Instalación

1. **Requisitos**: Linux (Ubuntu 20.04+), Docker, Docker Compose, 4GB RAM.

2. **Instalación**:

```bash
chmod +x setup.sh
sudo ./setup.sh
```

3. **Configuración**:

```bash
sudo nano /etc/beewax/.env
```

4. **Inicio**:

```bash
sudo systemctl start beewax
```

5. **Acceso**:

- Grafana: http://localhost:3000 (admin/contraseña)
- Node-RED: http://localhost:1880

## Módulo BeeCount (Análisis de Tráfico)

Configura tus cámaras en `beecount/app/roi_config.yaml` para monitorear el tráfico de abejas. El sistema contará automáticamente las abejas que entran y salen de cada colmena.

## Soporte

Para soporte técnico, contactar a support@beewax.shop o consultar la documentación completa.