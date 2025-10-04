import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from './types';
interface ExtendedWebSocket extends WebSocket {
    user?: {
        id: string;
        username: string;
        role: string;
    };
    isAlive?: boolean;
}
export declare function setupWebSocket(wss: WebSocketServer): void;
export declare function broadcastMessage(message: WebSocketMessage, filter?: (ws: ExtendedWebSocket) => boolean): void;
export declare function sendToUser(userId: string, message: WebSocketMessage): void;
export declare function sendToHive(hiveId: string, message: WebSocketMessage): void;
export {};
//# sourceMappingURL=websocket.d.ts.map