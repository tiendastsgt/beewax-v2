# Inicio Rápido: Sistema BeeWax (v2.0)

Este documento cubre los pasos esenciales para levantar la plataforma.

## 1. Pre-requisitos
Asegúrese de tener Docker y Docker Compose instalados.

## 2. Configuración Inicial
1. Copie el archivo de variables de entorno:
   `sudo cp .env.example /etc/beewax/.env`
2. Edite el archivo para establecer contraseñas seguras (`INFLUX_INIT_TOKEN`, `POSTGRES_PASSWORD`, etc.).

## 3. Instalación
Ejecute el script de configuración inicial para generar certificados SSL y configurar el servicio `systemd`:
`sudo ./setup.sh`

## 4. Primer Arranque
Inicie el sistema:
`sudo systemctl start beewax`

## 5. Verificación
Verifique que todos los contenedores estén levantados y saludables.
`docker-compose ps`