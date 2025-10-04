"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcastMessage = broadcastMessage;
exports.sendToUser = sendToUser;
exports.sendToHive = sendToHive;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const clients = new Set();
function setupWebSocket(wss) {
    wss.on('connection', (ws, request) => {
        console.log('New WebSocket connection');
        // Authenticate connection
        const url = new URL(request.url || '', 'http://localhost');
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(1008, 'Authentication required');
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            ws.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
            };
        }
        catch (error) {
            ws.close(1008, 'Invalid token');
            return;
        }
        ws.isAlive = true;
        clients.add(ws);
        // Send welcome message
        const welcomeMessage = {
            type: 'system_status',
            payload: { message: 'Connected to Colmena API', user: ws.user },
            timestamp: new Date(),
        };
        ws.send(JSON.stringify(welcomeMessage));
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleMessage(ws, message);
            }
            catch (error) {
                console.error('Invalid WebSocket message:', error);
            }
        });
        // Handle ping/pong for connection health
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('close', () => {
            console.log('WebSocket connection closed');
            clients.delete(ws);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });
    // Ping clients every 30 seconds to keep connections alive
    setInterval(() => {
        clients.forEach((ws) => {
            if (!ws.isAlive) {
                clients.delete(ws);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
}
function handleMessage(ws, message) {
    // Handle client messages if needed
    console.log('Received WebSocket message:', message);
}
function broadcastMessage(message, filter) {
    const messageStr = JSON.stringify(message);
    clients.forEach((ws) => {
        if (ws.readyState === ws_1.WebSocket.OPEN && (!filter || filter(ws))) {
            ws.send(messageStr);
        }
    });
}
function sendToUser(userId, message) {
    broadcastMessage(message, (ws) => ws.user?.id === userId);
}
function sendToHive(hiveId, message) {
    // In a real implementation, you'd track which users are subscribed to which hives
    broadcastMessage(message);
}
//# sourceMappingURL=websocket.js.map