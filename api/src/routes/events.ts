import { FastifyInstance } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';

export async function eventsRoutes(app: FastifyInstance) {

// SSE endpoint for real-time events
app.get('/api/v1/events', {
preHandler: [app.authenticate]
}, async (request: AuthenticatedRequest, reply) => {
reply.raw.writeHead(200, {
'Content-Type': 'text/event-stream',
'Cache-Control': 'no-cache',
'Connection': 'keep-alive',
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Headers': 'Cache-Control'
});

reply.raw.write('retry: 3000\n\n');

reply.raw.write(`event: connected\ndata: {"message":"Connected to BeeWax events","timestamp":"${new Date().toISOString()}"}\n\n`);

// Set up event emitter (simplified)
const interval = setInterval(() => {
// TODO: enganchar alertas de Grafana/Node-RED y progreso OTA
const mockEvent = {
type: 'heartbeat',
timestamp: new Date().toISOString(),
data: { status: 'ok' }
};
reply.raw.write(`event: ${mockEvent.type}\ndata: ${JSON.stringify(mockEvent.data)}\n\n`);
}, 30000); // Send heartbeat cada 30 segundos

// Clean up on disconnect
request.raw.on('close', () => {
clearInterval(interval);
});
});
}