import { FastifyInstance } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';
import { queryInfluxDB } from '../services/influx';

export async function telemetryRoutes(app: FastifyInstance) {

    // Get latest telemetry data for a hive
    app.get('/telemetry/:hive_id/latest', {
        preHandler: [app.authenticate, app.requireRole('viewer')]
    }, async (request: AuthenticatedRequest, reply) => {
        const { hive_id } = request.params as { hive_id: string };

        // Lógica para obtener el último punto de datos de InfluxDB
        const fluxQuery = `
            from(bucket: "telemetry")
                |> range(start: -5m)
                |> filter(fn: (r) => r._measurement == "hive_telemetry" and r.hive_id == "${hive_id}")
                |> last()
        `;
        const data = await queryInfluxDB(fluxQuery);
        return reply.send(data);
    });

    // Get historical data for a specific field
    app.get('/telemetry/:hive_id/:field', {
        preHandler: [app.authenticate, app.requireRole('viewer')]
    }, async (request: AuthenticatedRequest, reply) => {
        const { hive_id, field } = request.params as { hive_id: string, field: string };
        const { start, stop } = request.query as { start: string, stop: string };

        const fluxQuery = `
            from(bucket: "telemetry")
                |> range(start: ${start}, stop: ${stop})
                |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "${field}" and r.hive_id == "${hive_id}")
        `;
        const data = await queryInfluxDB(fluxQuery);
        return reply.send(data);
    });
}