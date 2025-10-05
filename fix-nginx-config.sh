#!/bin/bash
# fix-nginx-config.sh - Script para corregir configuración Nginx

echo "🔧 Corrigiendo configuración Nginx para BeeWax..."

# 1. Eliminar upstream ota_backend no utilizado
sed -i '/upstream ota_backend {/,/},/' nginx/nginx.conf

# 2. Actualizar proxy_pass para usar api_backend
find nginx/sites/ -name "*.conf" -exec sed -i 's/proxy_pass http:\/\/api:8080;/proxy_pass http:\/\/api_backend;/g' {} \;

# 3. Verificar cambios
echo "✅ Configuración corregida. Cambios:"
git diff nginx/nginx.conf nginx/sites/*.conf

# 4. Reiniciar Nginx si está corriendo
if [ "$1" == "--restart" ]; then
    echo "🔄 Reiniciando Nginx..."
    docker-compose restart nginx
fi

echo "🎯 Para aplicar cambios:"
echo "1. docker-compose down"
echo "2. docker-compose up -d"
echo "3. git add . && git commit -m 'Fix: Remove unused ota_backend upstream and fix proxy_pass references'"
echo "4. git push"