#!/bin/bash
# cleanup.sh - Detiene y elimina todos los contenedores y volúmenes de BeeWax

set -e

print_status() { echo -e "\033[0;34m[INFO]\033[0m $1"; }

print_status "Deteniendo y eliminando contenedores, redes y volúmenes temporales de BeeWax..."

# El comando 'docker-compose down -v --remove-orphans' detiene los servicios,
# elimina los contenedores y las redes definidas, y elimina los volúmenes anónimos.
# Usar '-v' (volúmenes) elimina también los volúmenes nombrados (mosquitto_data, influxdb_data, etc.), lo cual requiere precaución.

/usr/local/bin/docker-compose down --remove-orphans

# Si se desea eliminar también los volúmenes de datos persistentes:
# print_status "Si desea eliminar los datos persistentes (bases de datos y logs), ejecute:"
# echo "docker-compose down -v --remove-orphans"

echo "Limpieza de contenedores completada. Los volúmenes de datos persistentes se conservan."