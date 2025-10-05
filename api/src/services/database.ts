import { Pool } from 'pg';

const pool = new Pool({
    // Usa la variable de entorno DATABASE_URL definida en docker-compose.yml
    connectionString: process.env.DATABASE_URL || 'postgresql://beewax:change_me_postgres@device-registry:5432/devices'
});

export async function query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}

export async function getDevice(hiveId: string) {
    // Ejemplo de consulta a la tabla 'devices'
    const res = await query('SELECT * FROM devices WHERE hive_id = $1', [hiveId]);
    return res.rows;
}

// Placeholder para el registro de comandos (usado en la ruta OTA)
export async function recordCommandToDB(hiveId: string, commandType: string, commandData: any) {
    // La implementación real insertaría en la tabla 'command_history'
    const commandId = 'cmd-' + Math.random().toString(36).substr(2, 9);
    console.log(`[DB STUB] Recording command ${commandId} for ${hiveId}: ${commandType}`);
    // Ejemplo de inserción:
    // await query('INSERT INTO command_history (hive_id, command_type, command_data, status) VALUES ($1, $2, $3, $4)', [hiveId, commandType, commandData, 'queued']);
    return commandId;
}