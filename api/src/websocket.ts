import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketMessage } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface ExtendedWebSocket extends WebSocket {
  user?: {
    id: string;
    username: string;
    role: string;
  };
  isAlive?: boolean;
}

const clients = new Set<ExtendedWebSocket>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: ExtendedWebSocket, request: IncomingMessage) => {
    console.log('New WebSocket connection');

    // Authenticate connection
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      ws.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error) {
      ws.close(1008, 'Invalid token');
      return;
    }

    ws.isAlive = true;
    clients.add(ws);

    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: 'system_status',
      payload: { message: 'Connected to Colmena API', user: ws.user },
      timestamp: new Date(),
    };
    ws.send(JSON.stringify(welcomeMessage));

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
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

function handleMessage(ws: ExtendedWebSocket, message: any) {
  // Handle client messages if needed
  console.log('Received WebSocket message:', message);
}

export function broadcastMessage(message: WebSocketMessage, filter?: (ws: ExtendedWebSocket) => boolean) {
  const messageStr = JSON.stringify(message);

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && (!filter || filter(ws))) {
      ws.send(messageStr);
    }
  });
}

export function sendToUser(userId: string, message: WebSocketMessage) {
  broadcastMessage(message, (ws) => ws.user?.id === userId);
}

export function sendToHive(hiveId: string, message: WebSocketMessage) {
  // In a real implementation, you'd track which users are subscribed to which hives
  broadcastMessage(message);
}