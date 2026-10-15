import { Router } from 'express';
import type { Request, Response } from 'express';
import { MADRID_STATIONS, FIXED_ROUTES } from '../data/mockData.js';
import { findStationById, getAirQualityData } from '../services/simulator.js';
import { evaluateRisk, generateExplainableForecast } from '../services/riskEngine.js';
import type { Profile } from '../types.js';

const router = Router();
const VALID_PROFILES: Profile[] = ['general', 'deportista', 'asmatico', 'familia'];

/**
 * GET /api/zones
 * Lista de las 24 estaciones oficiales de la Red de Calidad del Aire de Madrid.
 */
router.get('/zones', (_req: Request, res: Response) => {
  res.json({
    zones: MADRID_STATIONS,
    routes: FIXED_ROUTES,
    count: MADRID_STATIONS.length,
    attribution: {
      openData: 'Ayuntamiento de Madrid – datos abiertos (CC BY 4.0)',
      weather: 'Open-Meteo',
    },
  });
});

/**
 * GET /api/air-quality?zone=ID&scenario=demo
 * Valores actuales de la estación (tiempo real de datos.madrid.es o simulación de respaldo).
 */
router.get('/air-quality', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || '28079008';
  const scenario = req.query.scenario as string | undefined;

  const station = findStationById(zoneId);
  const { airQuality } = await getAirQualityData(station, scenario);

  res.json(airQuality);
});

/**
 * GET /api/forecast?zone=ID&scenario=demo
 * Previsión a 6 horas combinando Open-Meteo y modelo de dispersión de Madrid.
 */
router.get('/forecast', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || '28079008';
  const scenario = req.query.scenario as string | undefined;

  const station = findStationById(zoneId);
  const { airQuality, hourlyWeatherForecast } = await getAirQualityData(station, scenario);

  const forecast = generateExplainableForecast(
    airQuality.aqi,
    airQuality.pollutants,
    airQuality.weather.windSpeed,
    new Date(),
    hourlyWeatherForecast
  );

  res.json({
    zoneId: station.id,
    zoneName: station.name,
    address: station.address,
    generatedAt: new Date().toISOString(),
    forecastHours: forecast,
    modelNotes:
      'Nowcasting físico-explicable a 6h basado en Open-Meteo y ciclo diario de tráfico rodado urbano del Ayuntamiento de Madrid.',
  });
});

/**
 * GET /api/recommendations?zone=ID&profile=TIPO&scenario=demo
 * Evalúa el riesgo y recomienda la mejor de las 4 rutas fijas protegidas.
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || '28079008';
  const profileQuery = req.query.profile as string | undefined;
  const asthmaQuery = req.query.asthma as string | undefined;
  const scenario = req.query.scenario as string | undefined;
  const isDemo = scenario === 'demo';

  let profile: Profile = 'deportista';
  if (profileQuery) {
    if (!VALID_PROFILES.includes(profileQuery as Profile)) {
      res.status(400).json({
        error: `Perfil no válido: '${profileQuery}'. Debe ser uno de: ${VALID_PROFILES.join(', ')}`,
      });
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

  res.json(recommendation);
});

export default router;
