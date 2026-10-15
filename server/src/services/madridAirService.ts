import type { PollutantValues, WeatherValues } from '../types.js';

const MADRID_REALTIME_CSV_URL =
  'https://ciudadesabiertas.madrid.es/dynamicAPI/API/query/calair_tiemporeal.csv?pageSize=5000';

// Cache en memoria para evitar peticiones redundantes (TTL 5 minutos)
let cachedRecords: Map<string, Map<number, number>> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Descarga y parsea el CSV en tiempo real de la Red de Calidad del Aire del Ayuntamiento de Madrid.
 */
export async function fetchMadridRealTimeData(): Promise<Map<string, Map<number, number>> | null> {
  const now = Date.now();
  if (cachedRecords && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRecords;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(MADRID_REALTIME_CSV_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'text/csv, text/plain, */*',
        'User-Agent': 'AireVecinal/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[MadridAirService] Respuesta no exitosa: ${response.status}`);
      return cachedRecords; // usar caché anterior si existe
    }

    const csvText = await response.text();
    const parsed = parseMadridCsv(csvText);

    if (parsed.size > 0) {
      cachedRecords = parsed;
      lastFetchTime = now;
      return parsed;
    }

    return cachedRecords;
  } catch (err) {
    console.warn('[MadridAirService] Error al conectar con datos abiertos de Madrid, usando fallback:', err);
    return cachedRecords;
  }
}

/**
 * Parsea el CSV con punto y coma:
 * PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;DIA;H01;V01;H02;V02...H24;V24
 */
export function parseMadridCsv(csvText: string): Map<string, Map<number, number>> {
  const stationMap = new Map<string, Map<number, number>>();
  const lines = csvText.split(/\r?\n/);

  if (lines.length < 2) return stationMap;

  const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
  const headers = headerLine.split(';').map((h) => h.trim());

  const estacionIdx = headers.indexOf('ESTACION');
  const magnitudIdx = headers.indexOf('MAGNITUD');

  if (estacionIdx === -1 || magnitudIdx === -1) {
    console.warn('[MadridAirService] Cabecera CSV no reconocida');
    return stationMap;
  }

  // Mapear posiciones de H01..H24 y V01..V24
  const hourMap: Array<{ hour: number; hIdx: number; vIdx: number }> = [];
  for (let h = 1; h <= 24; h++) {
    const hCol = `H${h.toString().padStart(2, '0')}`;
    const vCol = `V${h.toString().padStart(2, '0')}`;
    const hIdx = headers.indexOf(hCol);
    const vIdx = headers.indexOf(vCol);
    if (hIdx !== -1 && vIdx !== -1) {
      hourMap.push({ hour: h, hIdx, vIdx });
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    const stationCode = cols[estacionIdx]?.trim();
    const magnitude = parseInt(cols[magnitudIdx]?.trim(), 10);

    if (!stationCode || isNaN(magnitude)) continue;

    // Buscar la última hora válida (de 24 a 1)
    let lastValue: number | null = null;
    for (let h = hourMap.length - 1; h >= 0; h--) {
      const { hIdx, vIdx } = hourMap[h];
      const valStr = cols[hIdx]?.trim();
      const statusStr = cols[vIdx]?.trim();

      if (statusStr === 'V' && valStr !== undefined && valStr !== '') {
        const parsedVal = parseFloat(valStr.replace(',', '.'));
        if (!isNaN(parsedVal) && parsedVal >= 0) {
          lastValue = parsedVal;
          break;
        }
      }
    }

    if (lastValue !== null) {
      if (!stationMap.has(stationCode)) {
        stationMap.set(stationCode, new Map<number, number>());
      }
      stationMap.get(stationCode)!.set(magnitude, lastValue);
    }
  }

  return stationMap;
}

/**
 * Obtiene las concentraciones de contaminantes reales para una estación.
 * Magnitudes: 8 = NO2, 9 = PM2.5, 10 = PM10, 14 = O3
 */
export async function getRealPollutantsForStation(
  stationCode: string
): Promise<PollutantValues | null> {
  const data = await fetchMadridRealTimeData();
  if (!data) return null;

  // Los códigos en el CSV suelen ser "4", "8", "11", o con ceros a la izquierda
  const cleanCode = parseInt(stationCode, 10).toString();
  const stationMagnitudes = data.get(cleanCode) || data.get(stationCode);

  if (!stationMagnitudes || stationMagnitudes.size === 0) {
    return null;
  }

  const no2 = stationMagnitudes.get(8);
  const pm25 = stationMagnitudes.get(9);
  const pm10 = stationMagnitudes.get(10);
  const o3 = stationMagnitudes.get(14);

  // Si la estación no mide alguno de ellos, estimar a partir de valores urbanos promedio de la red
  return {
    no2: Math.round(no2 ?? 38),
    pm25: Math.round(pm25 ?? (pm10 ? pm10 * 0.55 : 14)),
    pm10: Math.round(pm10 ?? (pm25 ? pm25 * 1.8 : 24)),
    o3: Math.round(o3 ?? 42),
  };
}

/**
 * Consulta la previsión meteorológica a 48h desde Open-Meteo.
 */
export async function fetchOpenMeteoForecast(
  lat: number,
  lng: number
): Promise<{
  currentWeather: WeatherValues;
  hourlyForecast: Array<{ time: string; temperature: number; windSpeed: number }>;
} | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m&forecast_days=2&timezone=Europe%2FMadrid`;
    const response = await fetch(url);
    if (!response.ok) return null;

    interface OpenMeteoForecastResponse {
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        wind_speed_10m?: number[];
      };
    }

    const data = (await response.json()) as OpenMeteoForecastResponse;
    const hourly = data.hourly;
    if (!hourly || !hourly.time || !hourly.temperature_2m || !hourly.wind_speed_10m) {
      return null;
    }

    const now = new Date();
    let currentIndex = hourly.time.findIndex((t) => t.startsWith(now.toISOString().slice(0, 13)));
    if (currentIndex === -1) currentIndex = 0;

    const currentTemp = Math.round(hourly.temperature_2m[currentIndex] ?? 20);
    const currentWind = Math.round((hourly.wind_speed_10m[currentIndex] ?? 8) * 10) / 10;

    const hourlyForecast: Array<{ time: string; temperature: number; windSpeed: number }> = [];
    for (let i = 0; i < hourly.time.length; i++) {
      hourlyForecast.push({
        time: hourly.time[i],
        temperature: hourly.temperature_2m[i],
        windSpeed: hourly.wind_speed_10m[i],
      });
    }

    return {
      currentWeather: {
        temperature: currentTemp,
        windSpeed: currentWind,
        humidity: 48,
        windDirection: currentWind < 5 ? 'Calma / Viento bajo' : 'Brisa urbana',
      },
      hourlyForecast,
    };
  } catch (error) {
    console.warn('[OpenMeteo] Fallback meteorológico por error de conexión:', error);
    return null;
  }
}
