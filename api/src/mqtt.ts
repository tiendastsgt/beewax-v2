import mqtt from 'mqtt';
import { MQTTMessage } from './types';
import { broadcastMessage, sendToHive } from './websocket';
import { broadcastSSE } from './routes/sse';

/**
 * MQTT Broker Configuration
 *
 * Changed from using a single MQTT_BROKER_URL (e.g., 'mqtt://mosquitto:1883') to separate
 * MQTT_BROKER_HOST and MQTT_BROKER_PORT to avoid DNS resolution issues where the full URL
 * (including protocol) was being treated as the hostname. This ensures proper connection
 * by passing host and port explicitly in the connection options.
 */
const MQTT_BROKER_HOST = process.env.MQTT_BROKER_HOST || 'beewax-mqtt';
const MQTT_BROKER_PORT = parseInt(process.env.MQTT_BROKER_PORT || '1883');
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

let mqttClient: mqtt.MqttClient;

export function setupMQTT() {
  const options: mqtt.IClientOptions = {
    host: MQTT_BROKER_HOST,
    port: MQTT_BROKER_PORT,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: `colmena-api-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
  };

  mqttClient = mqtt.connect(options);

  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to topics
    mqttClient.subscribe('colmena/hives/+/sensors', { qos: 1 });
    mqttClient.subscribe('colmena/hives/+/status', { qos: 1 });
    mqttClient.subscribe('colmena/hives/+/ota', { qos: 1 });
    mqttClient.subscribe('colmena/alerts', { qos: 1 });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const mqttMessage: MQTTMessage = {
        topic,
        payload,
        timestamp: new Date(),
      };

      handleMQTTMessage(mqttMessage);
    } catch (error) {
      console.error('Invalid MQTT message:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });

  mqttClient.on('offline', () => {
    console.log('MQTT client offline');
  });

  mqttClient.on('reconnect', () => {
    console.log('MQTT client reconnecting');
  });
}

function handleMQTTMessage(message: MQTTMessage) {
  const { topic, payload } = message;

  if (topic.startsWith('colmena/hives/')) {
    const hiveId = topic.split('/')[2];

    if (topic.includes('/sensors')) {
      // Handle sensor data
      const wsMessage = {
        type: 'sensor_data' as const,
        payload: { hiveId, ...payload },
        timestamp: new Date(),
      };

      // Broadcast to WebSocket clients
      sendToHive(hiveId, wsMessage);

      // Send via SSE
      broadcastSSE('sensor_data', { hiveId, ...payload });

    } else if (topic.includes('/status')) {
      // Handle hive status updates
      const wsMessage = {
        type: 'system_status' as const,
        payload: { hiveId, ...payload },
        timestamp: new Date(),
      };

      sendToHive(hiveId, wsMessage);
      broadcastSSE('hive_status', { hiveId, ...payload });

    } else if (topic.includes('/ota')) {
      // Handle OTA status updates
      const wsMessage = {
        type: 'ota_status' as const,
        payload: { hiveId, ...payload },
        timestamp: new Date(),
      };

      sendToHive(hiveId, wsMessage);
      broadcastSSE('ota_status', { hiveId, ...payload });
    }
  } else if (topic === 'colmena/alerts') {
    // Handle alerts
    const wsMessage = {
      type: 'alert' as const,
      payload,
      timestamp: new Date(),
    };

    broadcastMessage(wsMessage);
    broadcastSSE('alert', payload);
  }
}

export function publishMQTTMessage(topic: string, payload: any, options?: mqtt.IClientPublishOptions) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, JSON.stringify(payload), { qos: 1, retain: false, ...options });
  } else {
    console.warn('MQTT client not connected, message not sent:', topic);
  }
}

export function subscribeToTopic(topic: string, options?: mqtt.IClientSubscribeOptions) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.subscribe(topic, { qos: 1, ...options });
  }
}

export function unsubscribeFromTopic(topic: string) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.unsubscribe(topic);
  }
}

export function getMQTTStatus() {
  return {
    connected: mqttClient?.connected || false,
    broker: `${MQTT_BROKER_HOST}:${MQTT_BROKER_PORT}`,
  };
}