import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL || 'http://influxdb:8086';
const token = process.env.INFLUX_TOKEN || process.env.INFLUX_INIT_TOKEN; // Permite el fallback del token
const org = 'apiary';
const bucket = 'telemetry';

const client = new InfluxDB({ url, token });
const queryApi = client.getQueryApi(org);
const writeApi = client.getWriteApi(org, bucket);

export async function queryInfluxDB(query: string) {
    try {
        const result = await queryApi.collectRows(query);
        return result;
    } catch (error) {
        console.error('InfluxDB Query Error:', error);
        throw new Error('Failed to query InfluxDB');
    }
}

export async function writeTelemetry(hiveId: string, data: any) {
    const point = new Point('hive_telemetry')
        .tag('hive_id', hiveId)
        .tag('apiary_id', data.apiary_id || 'A01')
        .floatField('weight_kg', data.weight_kg)
        .floatField('t_in_c', data.t_in_c);
    
    writeApi.writePoint(point);
    await writeApi.flush();
}