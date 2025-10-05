import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authPlugin } from './middleware/auth';
import { hivesRoutes } from './routes/hives';
import { telemetryRoutes } from './routes/telemetry';
import { alertsRoutes } from './routes/alerts';
import { systemRoutes } from './routes/system';
import { otaRoutes } from './routes/ota'; // La ruta OTA está implícita en la estructura completa
import { eventsRoutes } from './routes/events'; // La ruta Events está implícita en la estructura completa
import { setupWebSocket } from './websocket/websocket'; // La configuración de WebSocket está implícita

const app = Fastify({ logger: true });

app.register(cors);
app.register(jwt, { secret: process.env.JWT_SECRET || 'default-secret' });
app.register(authPlugin);

app.register(hivesRoutes, { prefix: '/api/v1' });
app.register(telemetryRoutes, { prefix: '/api/v1' });
app.register(alertsRoutes, { prefix: '/api/v1' });
app.register(systemRoutes, { prefix: '/api/v1' });
// Asumiendo el registro de rutas OTA y Events que son necesarias para el proyecto completo (A2)
app.register(otaRoutes, { prefix: '/api/v1' });
app.register(eventsRoutes, { prefix: '/api/v1' });

setupWebSocket(app); // Configuración de WebSockets

app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' }; // - El healthcheck básico reporta "ok" y la versión.
});

const start = async () => {
    try {
        await app.listen({ port: 8080, host: '0.0.0.0' });
        app.log.info(`Server listening on ${app.server.address()}`);
    } catch (err) { app.log.error(err); process.exit(1); }
};

start();