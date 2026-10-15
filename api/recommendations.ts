import type { IncomingMessage, ServerResponse } from 'http';
import { findStationById, getAirQualityData } from '../server/src/services/simulator.js';
import { evaluateRisk } from '../server/src/services/riskEngine.js';
import type { Profile } from '../server/src/types.js';

const VALID_PROFILES: Profile[] = ['general', 'deportista', 'asmatico', 'familia'];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const zoneId = url.searchParams.get('zone') || '28079008';
    const profileQuery = url.searchParams.get('profile') || undefined;
    const asthmaQuery = url.searchParams.get('asthma') || undefined;
    const scenario = url.searchParams.get('scenario') || undefined;
    const isDemo = scenario === 'demo';

    let profile: Profile = 'deportista';
    if (profileQuery) {
      if (!VALID_PROFILES.includes(profileQuery as Profile)) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            error: `Perfil no válido: '${profileQuery}'. Debe ser uno de: ${VALID_PROFILES.join(', ')}`,
          })
        );
        return;
      }
      profile = profileQuery as Profile;
    }

    const hasAsthma = asthmaQuery === 'true' || isDemo || profile === 'asmatico';
    const station = findStationById(zoneId);
    const { airQuality } = await getAirQualityData(station, scenario);

    const recommendation = evaluateRisk(
      airQuality.aqi,
      profile,
      hasAsthma,
      station.id,
      isDemo
    );

    res.statusCode = 200;
    res.end(JSON.stringify(recommendation));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Error al evaluar recomendaciones' }));
  }
}
