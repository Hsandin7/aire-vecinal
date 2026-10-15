import type { IncomingMessage, ServerResponse } from 'http';
import { findStationById, getAirQualityData } from '../server/src/services/simulator.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const zoneId = url.searchParams.get('zone') || '28079008';
    const scenario = url.searchParams.get('scenario') || undefined;

    const station = findStationById(zoneId);
    const { airQuality } = await getAirQualityData(station, scenario);

    res.statusCode = 200;
    res.end(JSON.stringify(airQuality));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Error al consultar calidad del aire' }));
  }
}
