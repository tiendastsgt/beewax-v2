# BeeCount - Módulo de Análisis de Tráfico de Abejas

BeeCount es un módulo de visión por computadora para el Sistema de Monitoreo de Colmenas BeeWax que cuenta las abejas que entran y salen de las colmenas utilizando análisis de video.

## Características

- **Soporte Multi-algoritmo**: Sustracción de fondo OpenCV y detección de objetos YOLO.
- **Procesamiento en Tiempo Real**: Procesamiento eficiente de streaming de video con FPS configurable.
- **Integración MQTT**: Publica datos de conteo a MQTT para integración con el sistema principal.
- **Monitoreo de Salud**: Endpoints de verificación de salud incorporados para monitoreo.
- **ROI Configurable**: Configuración por colmena de regiones de interés y líneas de conteo.
- **Horas Activas**: Horas activas configurables para reducir procesamiento durante la noche.
- **Métricas de Rendimiento**: Monitoreo de FPS y uso de CPU.

## Guía Rápida

### 1. Configuración

Edita `app/roi_config.yaml` para configurar tus colmenas:

```yaml
streams:
- hive_id: H001
apiary_id: A01
url: rtsp://admin:password@192.168.1.50:554/stream1
roi: # [x, y, ancho, alto]
line:
axis: "y" # línea horizontal
pos: 60 # posición desde el borde superior del ROI
direction:
up_is_out: true # abejas subiendo = saliendo
min_area: 50
max_area: 2000
max_dist: 40
algo: opencv
active_hours: "06:00-18:00"
```

### 2. Construir y Ejecutar

```bash
# Construir la imagen Docker
docker build -t beecount .

# Ejecutar con docker-compose
docker-compose up -d beecount

# O ejecutar de forma independiente
docker run -d \
--name beecount \
-v $(pwd)/app/roi_config.yaml:/app/app/roi_config.yaml:ro \
-e MQTT_HOST=tu-host-mqtt \
-e MQTT_USER=tu-usuario-mqtt \
-e MQTT_PASS=tu-contraseña-mqtt \
beecount
```

### 3. Monitorear

```bash
# Verificar salud
curl http://localhost:8080/health

# Verificar estado detallado
curl http://localhost:8080/status

# Ver logs
docker logs -f beecount
```

## Interpretación de Datos

### Métricas de Tráfico

- **bees_in_1m**: Abejas entrando en el último minuto
- **bees_out_1m**: Abejas saliendo en el último minuto
- **bees_net_1m**: Tráfico neto (entrada - salida)
- **fps**: Fotogramas por segundo de procesamiento
- **cpu_pct**: Uso de CPU del sistema

## Solución de Problemas

### Problemas Comunes
1. **FPS Bajo**
- Verificar calidad del streaming de la cámara
- Reducir tamaño del ROI
- Considerar usar YOLO con resolución más baja

2. **Sin Detecciones**
- Verificar configuración del ROI
- Ajustar umbrales de área (OpenCV)
- Verificar umbral de confianza (YOLO)

3. **Alto Uso de CPU**
- Reducir horas activas
- Optimizar parámetros del algoritmo
- Considerar actualizaciones de hardware

4. **Problemas de Conexión**
- Verificar URLs de las cámaras
- Verificar conectividad de red
- Revisar configuración MQTT

## Optimización para Guatemala
- **Horas activas**: "06:00-18:00" (horas de luz diurna)
- **Algoritmo**: OpenCV para mayor eficiencia energética
- **Consideraciones Climáticas**: Proteger las cámaras de la lluvia intensa.