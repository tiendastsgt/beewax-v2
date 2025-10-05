# BeeWax System Architecture (v2.0)

## Overview

El Sistema de Monitoreo de Colmenas BeeWax v2.0 opera bajo una arquitectura de microservicios robusta y contenerizada, diseñada para ser escalable y tener alta disponibilidad. La orquestación principal se realiza mediante Docker Compose (o Docker Swarm, como se observó en los entornos de Easy Panel), y está centrada en MQTT como el *bus* de eventos central.

## Key Components

El sistema se compone de los siguientes servicios principales:

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **MQTT Broker** | Mosquitto | Centro de comunicación en tiempo real para dispositivos y servicios. |
| **Data Stack** | InfluxDB + Telegraf | Almacenamiento de series de tiempo (telemetría) y recolección de métricas. |
| **Visualization** | Grafana | Dashboards, analítica, y motor de alertas predictivas. |
| **API Backend** | Node.js/Fastify | Punto de control central, autenticación (JWT/Roles), comandos OTA, y *endpoints* de datos. |
| **ML Service** | Python/Scikit-learn | Detección de anomalías por *ensemble* (Isolation Forest, OneClassSVM). |
| **BeeCount** | Python/OpenCV/YOLO | Análisis de video para conteo de tráfico de abejas. |
| **Device Registry** | PostgreSQL | Base de datos relacional para metadatos de dispositivos, credenciales y historial de comandos (OTA orchestration). |
| **Reverse Proxy** | Nginx | Terminación SSL/TLS, *proxy* para API/Grafana, y *hosting* estático para binarios OTA. |
| **Security** | Fail2ban | Protección contra ataques de fuerza bruta en Mosquitto. |

## Data Flow Pipeline

El flujo de datos sigue un patrón de mensajería asíncrona (MQTT) para garantizar la robustez, con diferentes servicios consumiendo la información según su rol:

1.  **Device (ESP32) → MQTT (Mosquitto):** El *firmware* envía la telemetría del sensor (peso, temperatura, acústica, batería) al tópico `hives/{id}/telemetry`.
2.  **MQTT → Telegraf → InfluxDB:** Telegraf se suscribe a `hives/+/telemetry` y `hives/+/beecount` para persistir los datos en InfluxDB.
3.  **MQTT → ML Service:** El servicio ML consume los datos de telemetría en tiempo real para evaluar las puntuaciones de anomalía. Si se detecta una anomalía, publica un evento en `hives/{id}/anomalies`.
4.  **API (Web/Mobile) → Command:**
    *   La API recibe una solicitud de comando (ej., iniciar OTA).
    *   La API registra el comando en `command_history` (PostgreSQL).
    *   La API publica el comando al dispositivo vía MQTT en `hives/{id}/commands`.
5.  **Device Status Feedback:** El *firmware* responde con el progreso de la acción al tópico `hives/{id}/status`.
6.  **OTA Orchestration (A2):** Un *worker* (pendiente de implementación) escucha el tópico `hives/{id}/status` y actualiza el estado (`queued` → `in_progress` → `success/fail`) en la tabla `command_history`.
7.  **Alerts/Events:** La API utiliza Server-Sent Events (SSE) o WebSockets (`/api/v1/events`) para transmitir en tiempo real las alertas generadas por Grafana o el progreso de OTA a las aplicaciones.

## Deployment Strategy (Production Ready)

El sistema se despliega utilizando imágenes Docker con límites de recursos definidos para cada servicio [73, 75, 76, 78–83]. La seguridad es prioritaria, utilizando:

*   **TLS 1.2/1.3** en Nginx para todos los dominios (`api.beewax.shop`, `grafana.beewax.shop`).
*   **Encabezados de Seguridad** (HSTS, CSP, X-Frame-Options DENY) aplicados por Nginx.
*   **Autenticación MQTT** basada en usuarios y ACL por tópico (`aclfile.acl`).
*   **JWT** para autenticación de API y roles.