import type { AirQualityResponse, PollutantValues, WeatherValues, Zone } from '../types.js';
import { calculateAqiAndDominant } from './riskEngine.js';
import { MADRID_STATIONS } from '../data/mockData.js';
import { getRealPollutantsForStation, fetchOpenMeteoForecast } from './madridAirService.js';

/**
 * Busca una estación por su ID (ej. '28079008') o código corto (ej. '8').
 * Si no se encuentra, devuelve por defecto 'Escuelas Aguirre' (28079008).
 */
export function findStationById(stationIdOrCode?: string): Zone {
  if (!stationIdOrCode) return MADRID_STATIONS[1]; // Escuelas Aguirre
  const found = MADRID_STATIONS.find(
    (s) =>
      s.id === stationIdOrCode ||
      s.code === stationIdOrCode ||
      parseInt(s.code, 10) === parseInt(stationIdOrCode, 10)
  );
  return found || MADRID_STATIONS[1];
}

// Alias de retrocompatibilidad
export const findZoneById = findStationById;

/**
 * Obtiene los datos de calidad del aire para una estación.
 * En modo real: consulta el portal de datos abiertos del Ayuntamiento de Madrid y Open-Meteo.
 * Si falla o DATA_MODE=simulated: genera datos simulados calibrados para Madrid.
 * En modo demo: fuerza la estación Escuelas Aguirre con NO2=130, PM2.5=45 y viento bajo.
 */
export async function getAirQualityData(
  station: Zone,
  scenario?: string
): Promise<{
  airQuality: AirQualityResponse;
  hourlyWeatherForecast?: Array<{ time: string; temperature: number; windSpeed: number }>;
}> {
  const isDemo = scenario === 'demo';
  const now = new Date();

  // Escenario DEMO oficial (Sección 5):
  // "El botón 'Simular episodio' usa la estación Escuelas Aguirre con NO₂ = 130, PM2.5 = 45, viento bajo y perfil deportista con asma."
  if (isDemo) {
    const demoStation = findStationById('28079008'); // Escuelas Aguirre
    const pollutants: PollutantValues = {
      no2: 130,
      pm25: 45,
      pm10: 68,
      o3: 32,
    };

    const weather: WeatherValues = {
      windSpeed: 3.2, // viento bajo
      temperature: 22,
      humidity: 45,
      windDirection: 'Calma / SO',
    };

    const result = calculateAqiAndDominant(pollutants);

    return {
      airQuality: {
        zoneId: demoStation.id,
        zoneName: demoStation.name,
        address: demoStation.address,
        timestamp: now.toISOString(),
        aqi: result.aqi,
        level: result.level,
        dominantPollutant: result.dominantPollutant,
        pollutants,
        weather,
        dataSource: 'simulated',
        scenario: 'demo',
      },
    };
  }

  const dataMode = process.env.DATA_MODE || 'real';
  let hourlyWeatherForecast: Array<{ time: string; temperature: number; windSpeed: number }> | undefined;
  let weather: WeatherValues = {
    windSpeed: 8,
    temperature: 20,
    humidity: 48,
    windDirection: 'NE 8 km/h',
  };

  // Intentar obtener meteorología real de Open-Meteo
  const openMeteoData = await fetchOpenMeteoForecast(station.coordinates[0], station.coordinates[1]);
  if (openMeteoData) {
    weather = openMeteoData.currentWeather;
    hourlyWeatherForecast = openMeteoData.hourlyForecast;
  }

  // Si está activado modo real, intentar leer CSV de Madrid
  if (dataMode !== 'simulated') {
    const realPollutants = await getRealPollutantsForStation(station.code);
    if (realPollutants) {
      const calculated = calculateAqiAndDominant(realPollutants);
      return {
        airQuality: {
          zoneId: station.id,
          zoneName: station.name,
          address: station.address,
          timestamp: now.toISOString(),
          aqi: calculated.aqi,
          level: calculated.level,
          dominantPollutant: calculated.dominantPollutant,
          pollutants: realPollutants,
          weather,
          dataSource: 'madrid-real',
        },
        hourlyWeatherForecast,
      };
    }
  }

  // Fallback a simulación realista si falla la red municipal o DATA_MODE=simulated
  const currentHour = now.getHours();
  const isMorningPeak = currentHour >= 8 && currentHour <= 10;
  const isEveningPeak = currentHour >= 18 && currentHour <= 21;
  const isPeak = isMorningPeak || isEveningPeak;

  let baseMultiplier = 1.0;
  if (station.type === 'urbana_trafico') {
    baseMultiplier = 1.3;
  } else if (station.type === 'suburbana') {
    baseMultiplier = 0.6;
  }

  let baseNo2 = 38;
  let basePm25 = 15;
  let basePm10 = 26;
  let baseO3 = 45;

  if (isPeak) {
    baseNo2 = isEveningPeak ? 90 : 75;
    basePm25 = isEveningPeak ? 30 : 24;
    basePm10 = isEveningPeak ? 50 : 40;
    baseO3 = 25;
  } else if (currentHour >= 23 || currentHour <= 6) {
    baseNo2 = 20;
    basePm25 = 10;
    basePm10 = 18;
    baseO3 = 30;
  }

  const simulatedPollutants: PollutantValues = {
    no2: Math.round(baseNo2 * baseMultiplier),
    pm25: Math.round(basePm25 * baseMultiplier),
    pm10: Math.round(basePm10 * baseMultiplier),
    o3: Math.round(baseO3 * (station.type === 'suburbana' ? 1.3 : 0.9)),
  };

  const calculated = calculateAqiAndDominant(simulatedPollutants);

  return {
    airQuality: {
      zoneId: station.id,
      zoneName: station.name,
      address: station.address,
      timestamp: now.toISOString(),
      aqi: calculated.aqi,
      level: calculated.level,
      dominantPollutant: calculated.dominantPollutant,
      pollutants: simulatedPollutants,
      weather,
      dataSource: 'simulated',
    },
    hourlyWeatherForecast,
  };
}
