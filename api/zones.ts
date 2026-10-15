import type { IncomingMessage, ServerResponse } from 'http';
import { MADRID_STATIONS, FIXED_ROUTES } from '../server/src/data/mockData.js';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      zones: MADRID_STATIONS,
      routes: FIXED_ROUTES,
      count: MADRID_STATIONS.length,
      attribution: {
        openData: 'Ayuntamiento de Madrid – datos abiertos (CC BY 4.0)',
        weather: 'Open-Meteo',
      },
    })
  );
}
