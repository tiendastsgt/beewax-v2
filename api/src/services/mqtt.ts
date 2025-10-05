import mqtt from 'mqtt';

const mqttUrl = process.env.MQTT_URL || 'mqtt://mosquitto:1883';
const mqttUser = 'api_service';
const mqttPass = process.env.MQTT_API_PASSWORD || 'change_me_mqtt';

const client = mqtt.connect(mqttUrl, {
    clientId: `api_service_${Math.random().toString(16).substr(2, 8)}`,
    username: mqttUser,
    password: mqttPass
});

client.on('connect', () => {
    console.log('Connected to MQTT broker'); // Confirma la conexión.
    // En la implementación completa, aquí se suscribiría al tópico de estado:
    // client.subscribe('hives/+/status', (err) => { ... });
});

client.on('error', (error) => {
    console.error('MQTT Error:', error);
});

export function publishCommand(hiveId: string, command: any): Promise<void> {
    const topic = `hives/${hiveId}/commands`;
    return new Promise((resolve, reject) => {
        client.publish(topic, JSON.stringify(command), { qos: 1 }, (err) => {
            if (err) {
                console.error(`Failed to publish command to ${topic}:`, err);
                reject(err);
            } else {
                console.log(`Command published to ${topic}`);
                resolve();
            }
        });
    });
}