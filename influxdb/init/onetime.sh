#!/bin/bash

# onetime.sh - Copiar tareas Flux al directorio de tareas de InfluxDB
set -e

echo "Copiando tareas Flux..."
cp /docker-entrypoint-initdb.d/tasks/*.flux /var/lib/influxdb2/tasks/

echo "Tareas Flux copiadas. InfluxDB se inicializará con ellas."