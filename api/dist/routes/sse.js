"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSSEToUser = sendSSEToUser;
exports.broadcastSSE = broadcastSSE;
const express_1 = require("express");
const router = (0, express_1.Router)();
// Store active SSE connections
const sseClients = new Map();
// GET /api/sse/events - Server-Sent Events endpoint
router.get('/events', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });
    // Send initial connection message
    const data = {
        type: 'connection',
        message: 'SSE connection established',
        user: req.user,
        timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Store the connection
    const clientId = req.user.id;
    sseClients.set(clientId, res);
    // Handle client disconnect
    req.on('close', () => {
        sseClients.delete(clientId);
    });
    req.on('error', () => {
        sseClients.delete(clientId);
    });
});
// Function to send SSE message to specific user
function sendSSEToUser(userId, eventType, data) {
    const client = sseClients.get(userId);
    if (client) {
        const message = {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
        };
        try {
            client.write(`data: ${JSON.stringify(message)}\n\n`);
        }
        catch (error) {
            // Client might be disconnected
            sseClients.delete(userId);
        }
    }
}
// Function to broadcast SSE message to all clients
function broadcastSSE(eventType, data) {
    const message = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
    };
    const messageStr = `data: ${JSON.stringify(message)}\n\n`;
    sseClients.forEach((client, clientId) => {
        try {
            client.write(messageStr);
        }
        catch (error) {
            sseClients.delete(clientId);
        }
    });
}
exports.default = router;
//# sourceMappingURL=sse.js.map