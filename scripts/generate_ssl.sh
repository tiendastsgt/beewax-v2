#!/bin/bash
# generate_ssl.sh - Genera certificados SSL autofirmados para Nginx

set -e

SSL_DIR="./nginx/ssl"

print_status() { echo -e "\033[0;34m[INFO]\033[0m $1"; }

print_status "Creando directorio SSL si no existe..."

mkdir -p $SSL_DIR

print_status "Generando certificados SSL autofirmados (365 días)..."

# Certificado para API
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$SSL_DIR/api.beewax.shop.key" -out "$SSL_DIR/api.beewax.shop.crt" -subj "/C=GT/ST=Guatemala/L=Guatemala/CN=api.beewax.shop"

# Certificado para Grafana
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$SSL_DIR/grafana.beewax.shop.key" -out "$SSL_DIR/grafana.beewax.shop.crt" -subj "/C=GT/ST=Guatemala/L=Guatemala/CN=grafana.beewax.shop"

# Certificado para OTA (Archivos estáticos)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$SSL_DIR/ota.beewax.shop.key" -out "$SSL_DIR/ota.beewax.shop.crt" -subj "/C=GT/ST=Guatemala/L=Guatemala/CN=ota.beewax.shop"

echo "Certificados SSL generados en $SSL_DIR"