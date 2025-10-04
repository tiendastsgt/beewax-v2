"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMQTT = setupMQTT;
exports.publishMQTTMessage = publishMQTTMessage;
exports.subscribeToTopic = subscribeToTopic;
exports.unsubscribeFromTopic = unsubscribeFromTopic;
exports.getMQTTStatus = getMQTTStatus;
const mqtt_1 = __importDefault(require("mqtt"));
const websocket_1 = require("./websocket");
const sse_1 = require("./routes/sse");
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
let mqttClient;
function setupMQTT() {
    const options = {
        host: MQTT_BROKER_URL,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: `colmena-api-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
    };
    mqttClient = mqtt_1.default.connect(MQTT_BROKER_URL, options);
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
            const mqttMessage = {
                topic,
                payload,
                timestamp: new Date(),
            };
            handleMQTTMessage(mqttMessage);
        }
        catch (error) {
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
function handleMQTTMessage(message) {
    const { topic, payload } = message;
    if (topic.startsWith('colmena/hives/')) {
        const hiveId = topic.split('/')[2];
        if (topic.includes('/sensors')) {
            // Handle sensor data
            const wsMessage = {
                type: 'sensor_data',
                payload: { hiveId, ...payload },
                timestamp: new Date(),
            };
            // Broadcast to WebSocket clients
            (0, websocket_1.sendToHive)(hiveId, wsMessage);
            // Send via SSE
            (0, sse_1.broadcastSSE)('sensor_data', { hiveId, ...payload });
        }
        else if (topic.includes('/status')) {
            // Handle hive status updates
            const wsMessage = {
                type: 'system_status',
                payload: { hiveId, ...payload },
                timestamp: new Date(),
            };
            (0, websocket_1.sendToHive)(hiveId, wsMessage);
            (0, sse_1.broadcastSSE)('hive_status', { hiveId, ...payload });
        }
        else if (topic.includes('/ota')) {
            // Handle OTA status updates
            const wsMessage = {
                type: 'ota_status',
                payload: { hiveId, ...payload },
                timestamp: new Date(),
            };
            (0, websocket_1.sendToHive)(hiveId, wsMessage);
            (0, sse_1.broadcastSSE)('ota_status', { hiveId, ...payload });
        }
    }
    else if (topic === 'colmena/alerts') {
        // Handle alerts
        const wsMessage = {
            type: 'alert',
            payload,
            timestamp: new Date(),
        };
        (0, websocket_1.broadcastMessage)(wsMessage);
        (0, sse_1.broadcastSSE)('alert', payload);
    }
}
function publishMQTTMessage(topic, payload, options) {
    if (mqttClient && mqttClient.connected) {
        mqttClient.publish(topic, JSON.stringify(payload), { qos: 1, retain: false, ...options });
    }
    else {
        console.warn('MQTT client not connected, message not sent:', topic);
    }
}
function subscribeToTopic(topic, options) {
    if (mqttClient && mqttClient.connected) {
        mqttClient.subscribe(topic, { qos: 1, ...options });
    }
}
function unsubscribeFromTopic(topic) {
    if (mqttClient && mqttClient.connected) {
        mqttClient.unsubscribe(topic);
    }
}
function getMQTTStatus() {
    return {
        connected: mqttClient?.connected || false,
        broker: MQTT_BROKER_URL,
    };
}
//# sourceMappingURL=mqtt.js.map