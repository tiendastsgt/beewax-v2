#!/bin/bash
# init_users.sh - Inicializa usuarios y contraseñas de MQTT

set -e

# Variable de entorno de la contraseña de la API para el servicio API, ML y BeeCount
MQTT_API_PASSWORD="${MQTT_API_PASSWORD}"

# Verificar que la herramienta mosquitto_passwd esté disponible
if ! command -v mosquitto_passwd &> /dev/null
then
    echo "Error: mosquitto_passwd no encontrado. Asegúrese de que el entorno de Docker lo soporte."
    exit 1
fi

echo "Inicializando usuarios MQTT..."

# 1. Crear el usuario de la API (utilizado por el API, ML, Telegraf y BeeCount)
# Este usuario necesita permisos de lectura/escritura en ciertos tópicos definidos en aclfile.acl
mosquitto_passwd -b /mosquitto/config/passwords api_service "${MQTT_API_PASSWORD}"

# 2. Crear usuarios de dispositivos (H001, H002, H003, H004, H005)
# Nota: Las contraseñas para los dispositivos se asumen codificadas o generadas previamente
# En un entorno de producción, las contraseñas de los dispositivos no deberían ser hardcodeadas,
# sino generadas de forma segura y almacenadas en el device-registry (PostgreSQL) [5, 6].
# Se usa 'DEVICE_PASSWORD_HXXX' como marcador de posición aquí.

# Usuario H001
mosquitto_passwd -b /mosquitto/config/passwords H001 "DEVICE_PASSWORD_H001"

# Usuario H002
mosquitto_passwd -b /mosquitto/config/passwords H002 "DEVICE_PASSWORD_H002"

# Usuario H003
mosquitto_passwd -b /mosquitto/config/passwords H003 "DEVICE_PASSWORD_H003"

# Usuario H004
mosquitto_passwd -b /mosquitto/config/passwords H004 "DEVICE_PASSWORD_H004"

# Usuario H005
mosquitto_passwd -b /mosquitto/config/passwords H005 "DEVICE_PASSWORD_H005"

echo "Usuarios MQTT inicializados y guardados en /mosquitto/config/passwords."

# 3. Eliminar el archivo temporal .env para evitar filtraciones de secretos
# Este paso es crucial para la seguridad, aunque aquí se asume que las variables se inyectan directamente.
rm -f /tmp/.env_users_temp || true