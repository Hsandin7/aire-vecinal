import type { AirQualityResponse, PollutantValues, WeatherValues, Zone } from '../types.js';
import { calculateAqiAndDominant } from './riskEngine.js';
import { MADRID_ZONES } from '../data/mockData.js';

/**
 * Consulta la API pública Open-Meteo Air Quality (opcional si USE_REAL_DATA=true).
 */
export async function fetchOpenMeteoAirQuality(lat: number, lng: number): Promise<PollutantValues | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,nitrogen_dioxide,ozone`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      return null;
    }
    interface OpenMeteoResult {
      current?: {
        pm2_5?: number;
        pm10?: number;
        nitrogen_dioxide?: number;
        ozone?: number;
      };
    }
    const json = (await response.json()) as OpenMeteoResult;
    const current = json.current;
    if (!current) return null;

    return {
      pm25: Math.round(current.pm2_5 ?? 15),
      pm10: Math.round(current.pm10 ?? 25),
      no2: Math.round(current.nitrogen_dioxide ?? 35),
      o3: Math.round(current.ozone ?? 40),
    };
  } catch (error) {
    console.warn('[Open-Meteo] Error al conectar con Open-Meteo API. Usando simulación:', error);
    return null;
  }
}

/**
 * Genera datos de calidad del aire simulados de forma realista con picos en horas punta (8-10h y 18-21h)
 * y viento bajo, permitiendo forzar el escenario demo.
 */
export async function getAirQualityData(
  zone: Zone,
  scenario?: string
): Promise<AirQualityResponse> {
  const isDemo = scenario === 'demo';
  const now = new Date();
  const currentHour = now.getHours();

  // Escenario DEMO fijado según sección 8:
  // "Datos ficticios: NO₂ = 130 µg/m³, PM2.5 = 45 µg/m³, viento bajo, perfil = deportista con asma"
  if (isDemo) {
    const pollutants: PollutantValues = {
      no2: 130,
      pm25: 45,
      pm10: 68,
      o3: 32,
    };

    const weather: WeatherValues = {
      windSpeed: 3.2, // viento bajo (< 5 km/h)
      temperature: 22,
      humidity: 45,
      windDirection: 'Calma / SO',
    };

    const result = calculateAqiAndDominant(pollutants);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      timestamp: now.toISOString(),
      aqi: result.aqi,
      level: result.level,
      dominantPollutant: result.dominantPollutant,
      pollutants,
      weather,
      dataSource: 'simulated',
      scenario: 'demo',
    };
  }

  // Comprobar si se solicitan datos reales de Open-Meteo mediante variable de entorno
  const useRealData = process.env.USE_REAL_DATA === 'true';
  let realPollutants: PollutantValues | null = null;
  if (useRealData) {
    realPollutants = await fetchOpenMeteoAirQuality(zone.coordinates[0], zone.coordinates[1]);
  }

  if (realPollutants) {
    const result = calculateAqiAndDominant(realPollutants);
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      timestamp: now.toISOString(),
      aqi: result.aqi,
      level: result.level,
      dominantPollutant: result.dominantPollutant,
      pollutants: realPollutants,
      weather: {
        windSpeed: 8,
        temperature: 20,
        humidity: 50,
        windDirection: 'NE',
      },
      dataSource: 'open-meteo',
    };
  }

  // Generación simulada realista con picos de hora punta y tipo de zona urbana:
  const isMorningPeak = currentHour >= 8 && currentHour <= 10;
  const isEveningPeak = currentHour >= 18 && currentHour <= 21;
  const isPeak = isMorningPeak || isEveningPeak;

  // Modificador según tipología de la zona
  let zoneMultiplier: number;
  if (zone.type === 'avenida') {
    zoneMultiplier = 1.35;
  } else if (zone.type === 'parque') {
    zoneMultiplier = 0.55;
  } else {
    zoneMultiplier = 1.0; // residencial
  }

  // Simulación temporal realista
  let baseNo2 = 35;
  let basePm25 = 14;
  let basePm10 = 26;
  let baseO3 = 45;
  let windSpeed = 11;

  if (isPeak) {
    // Pico de tráfico y menor dispersión
    baseNo2 = isEveningPeak ? 95 : 80;
    basePm25 = isEveningPeak ? 32 : 26;
    basePm10 = isEveningPeak ? 54 : 44;
    baseO3 = 28;
    windSpeed = 4.2; // viento bajo en hora punta
  } else if (currentHour >= 23 || currentHour <= 6) {
    baseNo2 = 18;
    basePm25 = 9;
    basePm10 = 16;
    baseO3 = 35;
    windSpeed = 7.5;
  }

  const finalPollutants: PollutantValues = {
    no2: Math.round(baseNo2 * zoneMultiplier),
    pm25: Math.round(basePm25 * zoneMultiplier),
    pm10: Math.round(basePm10 * zoneMultiplier),
    o3: Math.round(baseO3 * (zone.type === 'parque' ? 1.2 : 0.9)),
  };

  const weather: WeatherValues = {
    windSpeed: Math.round(windSpeed * 10) / 10,
    temperature: 21,
    humidity: 48,
    windDirection: 'NE 4 km/h',
  };

  const calculated = calculateAqiAndDominant(finalPollutants);

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    timestamp: now.toISOString(),
    aqi: calculated.aqi,
    level: calculated.level,
    dominantPollutant: calculated.dominantPollutant,
    pollutants: finalPollutants,
    weather,
    dataSource: 'simulated',
  };
}

export function findZoneById(zoneId?: string): Zone {
  if (!zoneId) return MADRID_ZONES[0];
  const found = MADRID_ZONES.find((z) => z.id === zoneId);
  return found || MADRID_ZONES[0];
}
