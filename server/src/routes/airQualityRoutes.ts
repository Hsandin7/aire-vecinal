import { Router } from 'express';
import type { Request, Response } from 'express';
import { MADRID_ZONES } from '../data/mockData.js';
import { findZoneById, getAirQualityData } from '../services/simulator.js';
import { evaluateRisk, generateExplainableForecast } from '../services/riskEngine.js';
import { getUserPreferences, saveUserPreferences } from '../services/storage.js';
import type { Profile } from '../types.js';

const router = Router();

const VALID_PROFILES: Profile[] = ['general', 'deportista', 'asmatico', 'familia'];

/**
 * GET /api/zones
 * Lista de zonas/barrios simulados con coordenadas.
 */
router.get('/zones', (_req: Request, res: Response) => {
  res.json({
    zones: MADRID_ZONES,
    count: MADRID_ZONES.length,
  });
});

/**
 * GET /api/air-quality?zone=ID&scenario=demo
 * Valores actuales de PM2.5, PM10, NO₂, O₃, índice calculado, nivel y meteorología.
 */
router.get('/air-quality', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || 'madrid-castellana';
  const scenario = req.query.scenario as string | undefined;

  const zone = findZoneById(zoneId);
  const data = await getAirQualityData(zone, scenario);

  res.json(data);
});

/**
 * GET /api/forecast?zone=ID&scenario=demo
 * Previsión por horas de las próximas 6 h con índice previsto y explicación de factores.
 */
router.get('/forecast', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || 'madrid-castellana';
  const scenario = req.query.scenario as string | undefined;

  const zone = findZoneById(zoneId);
  const currentData = await getAirQualityData(zone, scenario);

  const forecast = generateExplainableForecast(
    currentData.aqi,
    currentData.pollutants,
    currentData.weather.windSpeed
  );

  res.json({
    zoneId: zone.id,
    zoneName: zone.name,
    generatedAt: new Date().toISOString(),
    forecastHours: forecast,
    modelNotes:
      'Nowcasting físico-explicable a 6h basado en tendencia base, ciclo diario de tráfico rodado urbano y factor de dispersión eólica.',
  });
});

/**
 * GET /api/recommendations?zone=ID&profile=TIPO&scenario=demo
 * Recomendación personalizada y ruta alternativa calculada según el motor de riesgo.
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  const zoneId = (req.query.zone as string) || 'madrid-castellana';
  const profileQuery = req.query.profile as string | undefined;
  const scenario = req.query.scenario as string | undefined;
  const isDemo = scenario === 'demo';

  let profile: Profile;
  if (profileQuery) {
    if (!VALID_PROFILES.includes(profileQuery as Profile)) {
      res.status(400).json({
        error: `Perfil no válido: '${profileQuery}'. Debe ser uno de: ${VALID_PROFILES.join(', ')}`,
      });
      return;
    }
    profile = profileQuery as Profile;
  } else {
    const userPrefs = getUserPreferences();
    profile = userPrefs.profile;
  }

  const zone = findZoneById(zoneId);
  const currentData = await getAirQualityData(zone, scenario);
  const userPrefs = getUserPreferences();

  const recommendation = evaluateRisk(
    currentData.aqi,
    profile,
    userPrefs.hasAsthma,
    zone.id,
    isDemo
  );

  res.json(recommendation);
});

/**
 * GET /api/profile
 * Lee las preferencias del usuario persistidas.
 */
router.get('/profile', (_req: Request, res: Response) => {
  const prefs = getUserPreferences();
  res.json(prefs);
});

/**
 * POST /api/profile
 * Guarda las preferencias del usuario (valida perfil, zonas y tipos de alerta).
 */
router.post('/profile', (req: Request, res: Response) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Cuerpo de petición inválido o ausente' });
    return;
  }

  if (body.profile && !VALID_PROFILES.includes(body.profile)) {
    res.status(400).json({
      error: `Perfil no válido. Valores permitidos: ${VALID_PROFILES.join(', ')}`,
    });
    return;
  }

  if (body.alertTypes && !['all', 'severe_only'].includes(body.alertTypes)) {
    res.status(400).json({
      error: "Tipo de alerta no válido. Valores permitidos: 'all', 'severe_only'",
    });
    return;
  }

  if (body.favoriteZones && !Array.isArray(body.favoriteZones)) {
    res.status(400).json({
      error: 'favoriteZones debe ser un arreglo de IDs de zona',
    });
    return;
  }

  const updated = saveUserPreferences(body);
  res.json({
    message: 'Preferencias actualizadas correctamente',
    profile: updated,
  });
});

export default router;
