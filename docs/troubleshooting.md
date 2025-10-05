# Troubleshooting Guide (BeeWax v2.0)

Esta guía cubre los problemas comunes y los pasos de diagnóstico para los componentes centrales de BeeWax, incluyendo las correcciones críticas identificadas.

## 1. Stack Startup Issues (Problemas de Arranque del Stack)

**Síntoma:** Uno o más contenedores fallan al iniciarse o reportan `unhealthy` o `restarting`.

| Servicio | Problema Potencial | Diagnóstico y Solución |
| :--- | :--- | :--- |
| **Telegraf** | **Fallo Crítico de Token:** No puede escribir datos en InfluxDB. | Revisar logs de Telegraf. **Solución:** Asegúrese de que `docker-compose.yml` en la sección de `telegraf` use `INFLUX_TOKEN=${INFLUX_INIT_TOKEN}` para resolver el *mismatch* de variables. |
| **Mosquitto** | **Health Check Falla:** El chequeo falla al intentar suscribirse sin autenticación. | **Solución:** Reemplazar el comando `healthcheck` en `docker-compose.yml` por una verificación TCP o un comando `CMD-SHELL` autenticado más robusto. |
| **Grafana** | **Fallo de Provisión de Datasource:** No puede leer el token de InfluxDB. | Revisar logs de Grafana. **Solución:** Verificar que el contenedor de Grafana esté utilizando el `entrypoint.sh` y `envsubst` para inyectar `INFLUX_INIT_TOKEN` de forma segura en `influx.yml`. |

## 2. No Data in Grafana (Sin Datos en los Paneles)

**Síntoma:** Los dashboards de peso o temperatura (`apiary_overview.json`) muestran "No Data".

1.  **Verificación MQTT:** Confirme que el *broker* Mosquitto está recibiendo mensajes del dispositivo (revise logs de Mosquitto).
2.  **Verificación Telegraf:** Revise los logs de Telegraf para errores de conexión a InfluxDB o fallos al procesar el JSON.
3.  **Verificación Flux:** Si los paneles de predicción (`colony_strength_score.json`) fallan, revise las tareas Flux: el archivo `harvest_prediction.flux` debe usar `import "experimental"` y `experimental.linearRegression()`.

## 3. BeeCount Module Issues (Problemas de Conteo de Abejas)

**Síntoma:** El servicio `beecount` está activo, pero `bees_net_1m` es 0, o los FPS son bajos.

1.  **Verificación de Logs:** Revise los logs de BeeCount para errores de conexión con la cámara o fallos de inicialización del modelo YOLO/OpenCV.
2.  **Configuración de ROI:** Verifique que el archivo `beecount/app/roi_config.yaml` tenga la URL, el ROI y las coordenadas de la línea de conteo definidas correctamente.
3.  **Rendimiento:** Si los FPS son muy bajos (`fps` < 5), considere reducir el tamaño del ROI o cambiar el algoritmo de YOLO a OpenCV para menor consumo de CPU.
4.  **Integración MQTT:** Confirme que Telegraf está consumiendo el tópico `hives/+/beecount` (revisar `inputs_mqtt_beecount.conf`).

## 4. Security and Access Issues

**Síntoma:** Los dispositivos o usuarios API no pueden conectarse a MQTT.

1.  **ACLs:** Si la API (`api_service`) o los dispositivos (`H001`) no pueden escribir/leer, revise el archivo `mosquitto/aclfile.acl` para asegurar que los permisos por tópico sean correctos.
2.  **Fail2ban:** Si la API pierde la conexión de repente, verifique si la IP de su *host* o contenedor ha sido bloqueada por Fail2ban debido a intentos de conexión fallidos a Mosquitto.

## 5. Firmware Updates (OTA)

**Síntoma:** La actualización OTA inicia (`status: sent`) pero se detiene o falla en el dispositivo.

1.  **Hosting Estático:** Verifique la configuración de Nginx (`ota.beewax.shop.conf`) y asegure que el directorio `/srv/ota` esté montado correctamente y que Nginx pueda servir los archivos `.bin` con HTTPS y la cabecera `X-Content-Type-Options nosniff`.
2.  **SHA-256:** Confirme que el valor `sha256` en `ota/firmware_registry.json` y el valor publicado en el comando MQTT coincidan exactamente con el *hash* del archivo `.bin`.
3.  **Orquestación:** Si el estado no se actualiza a `success` o `fail` en PostgreSQL, significa que el *worker* (pendiente de implementación) no está escuchando el tópico de estado del dispositivo (`hives/{id}/status`) o no está actualizando la tabla `command_history`.