import mqtt from 'mqtt';
export declare function setupMQTT(): void;
export declare function publishMQTTMessage(topic: string, payload: any, options?: mqtt.IClientPublishOptions): void;
export declare function subscribeToTopic(topic: string, options?: mqtt.IClientSubscribeOptions): void;
export declare function unsubscribeFromTopic(topic: string): void;
export declare function getMQTTStatus(): {
    connected: boolean;
    broker: string;
};
//# sourceMappingURL=mqtt.d.ts.map