import type { Level, Profile, PollutantValues, RecommendationResponse, ForecastHour, RouteAlternative } from '../types.js';
import { FIXED_ROUTES } from '../data/mockData.js';

/**
 * Umbrales de contaminantes basados en el Índice Europeo de Calidad del Aire (EAQI)
 * y directrices de la OMS.
 */
export const THRESHOLDS = {
  pm25: { good: 10, moderate: 25, bad: 50 },
  no2: { good: 40, moderate: 100, bad: 200 },
  pm10: { good: 20, moderate: 50, bad: 100 },
  o3: { good: 50, moderate: 100, bad: 160 },
};

/**
 * Calcula el subíndice (escala normalizada 0 - 200) para un contaminante.
 */
export function calculateSubIndex(value: number, limits: { good: number; moderate: number; bad: number }): number {
  if (value <= 0) return 0;
  if (value <= limits.good) {
    return Math.round((value / limits.good) * 50);
  } else if (value <= limits.moderate) {
    const ratio = (value - limits.good) / (limits.moderate - limits.good);
    return Math.round(50 + ratio * 50);
  } else if (value <= limits.bad) {
    const ratio = (value - limits.moderate) / (limits.bad - limits.moderate);
    return Math.round(100 + ratio * 50);
  } else {
    const ratio = (value - limits.bad) / limits.bad;
    return Math.min(250, Math.round(150 + ratio * 50));
  }
}

/**
 * Calcula el índice global de calidad del aire y determina el contaminante dominante.
 */
export function calculateAqiAndDominant(pollutants: PollutantValues): {
  aqi: number;
  level: Level;
  dominantPollutant: 'pm25' | 'pm10' | 'no2' | 'o3';
} {
  const pm25Sub = calculateSubIndex(pollutants.pm25, THRESHOLDS.pm25);
  const pm10Sub = calculateSubIndex(pollutants.pm10, THRESHOLDS.pm10);
  const no2Sub = calculateSubIndex(pollutants.no2, THRESHOLDS.no2);
  const o3Sub = calculateSubIndex(pollutants.o3, THRESHOLDS.o3);

  const entries: Array<{ key: 'pm25' | 'pm10' | 'no2' | 'o3'; sub: number }> = [
    { key: 'pm25', sub: pm25Sub },
    { key: 'pm10', sub: pm10Sub },
    { key: 'no2', sub: no2Sub },
    { key: 'o3', sub: o3Sub },
  ];

  entries.sort((a, b) => b.sub - a.sub);
  const maxEntry = entries[0];
  const aqi = maxEntry.sub;

  let level: Level;
  if (aqi <= 50) {
    level = 'bueno';
  } else if (aqi <= 100) {
    level = 'moderado';
  } else if (aqi <= 150) {
    level = 'malo';
  } else {
    level = 'muy_malo';
  }

  return {
    aqi,
    level,
    dominantPollutant: maxEntry.key,
  };
}

/**
 * Verifica si el usuario pertenece a un grupo sensible a la contaminación.
 */
export function isUserSensitive(profile: Profile, hasAsthma = false): boolean {
  if (hasAsthma) return true;
  return profile === 'asmatico' || profile === 'familia' || profile === 'deportista';
}

/**
 * Selecciona la mejor ruta de las 4 fijas (Retiro, Madrid Río, Casa de Campo, Parque del Oeste)
 * según el mejor índice previsto (menor AQI).
 */
export function selectBestRoute(preferredStationId?: string, isDemo = false): RouteAlternative {
  if (isDemo || preferredStationId === '28079008' || preferredStationId === '8') {
    // Para la demo o en el entorno de Escuelas Aguirre, la ruta natural es El Retiro
    return FIXED_ROUTES[0];
  }

  // Ordenar por mejor índice previsto (menor AQI)
  const sorted = [...FIXED_ROUTES].sort((a, b) => a.expectedAqi - b.expectedAqi);
  return sorted[0];
}

/**
 * Motor de riesgo (Risk Engine):
 * Evalúa las condiciones y formula las recomendaciones de salud urbana.
 */
export function evaluateRisk(
  aqi: number,
  profile: Profile,
  hasAsthma = false,
  stationId = '28079008',
  isDemo = false
): RecommendationResponse {
  const sensitive = isUserSensitive(profile, hasAsthma);
  let level: Level;
  if (aqi <= 50) {
    level = 'bueno';
  } else if (aqi <= 100) {
    level = 'moderado';
  } else if (aqi <= 150) {
    level = 'malo';
  } else {
    level = 'muy_malo';
  }

  let summary: string;
  let alertTitle: string;
  let alertMessage: string;
  let timeWindow: string | undefined;
  const actionItems: string[] = [];
  let alternativeRoute: RouteAlternative | undefined;

  if (aqi > 100) {
    timeWindow = '18:00 a 21:00';
    alternativeRoute = selectBestRoute(stationId, isDemo);

    if (sensitive) {
      alertTitle = 'Riesgo alto para tu perfil sensible';
      summary = `Calidad del aire desfavorable (AQI ${aqi}). Concentraciones elevadas de contaminantes urbanos.`;

      if (isDemo || (profile === 'deportista' && hasAsthma)) {
        alertMessage =
          'Riesgo alto en tu zona de 18:00 a 21:00. Evita correr hoy; si sales, usa la ruta por el Retiro (índice Bueno).';
      } else if (profile === 'deportista') {
        alertMessage = `Riesgo alto en tu zona de 18:00 a 21:00. Evita correr hoy; si sales, usa la ${alternativeRoute.name} (índice Bueno).`;
      } else {
        alertMessage = 'Evita actividad al aire libre';
      }

      actionItems.push(
        'Evita salir a correr o realizar ejercicio aeróbico intenso en las horas punta de tráfico.',
        'Mantén las ventanas cerradas en las franjas de mayor concentración (18:00 a 21:00).',
        `Si necesitas salir, trasládate al pulmón verde más cercano: ${alternativeRoute.name} (-${alternativeRoute.exposureReductionPercentage}% de exposición).`
      );
    } else {
      alertTitle = 'Calidad del aire no saludable';
      alertMessage = 'Reduce el ejercicio intenso';
      summary = `Niveles elevados de contaminantes (AQI ${aqi}). Conviene limitar esfuerzos prolongados.`;
      actionItems.push(
        'Modera la intensidad del ejercicio al aire libre.',
        'Evita las avenidas con mayor afluencia de vehículos.',
        `Utiliza la ruta alternativa recomendada: ${alternativeRoute.name}.`
      );
    }
  } else if (aqi >= 50) {
    alertTitle = 'Calidad del aire aceptable';
    alertMessage = 'Precaución si eres sensible';
    summary = `Nivel moderado (AQI ${aqi}). Calidad aceptable para la población general con precaución para sensibles.`;
    actionItems.push(
      'Si tienes asma o sensibilidad respiratoria, presta atención a posibles irritaciones.',
      'Actividades al aire libre permitidas normalmente para el resto de la población.'
    );
  } else {
    alertTitle = 'Calidad del aire óptima';
    alertMessage = 'Aire bueno, ¡disfruta al aire libre!';
    summary = `Nivel excelente (AQI ${aqi}). Condiciones ideales para el deporte y la ventilación natural.`;
    actionItems.push(
      'Momento ideal para realizar ejercicio y entrenamientos al aire libre.',
      'Abre ventanas para ventilar el hogar con aire limpio.'
    );
  }

  return {
    zoneId: stationId,
    profile,
    aqi,
    level,
    summary,
    alertTitle,
    alertMessage,
    timeWindow,
    actionItems,
    alternativeRoute,
  };
}

/**
 * Modelo simple y explicable de predicción horaria (Nowcasting a 6h).
 * Utiliza previsiones meteorológicas reales (Open-Meteo) si están disponibles,
 * combinadas con el ciclo horario de tráfico de Madrid.
 */
export function generateExplainableForecast(
  _baseAqi: number,
  basePollutants: PollutantValues,
  baseWindSpeed: number,
  startHourDate: Date = new Date(),
  weatherForecast?: Array<{ time: string; temperature: number; windSpeed: number }>
): ForecastHour[] {
  const forecast: ForecastHour[] = [];

  for (let i = 1; i <= 6; i++) {
    const targetDate = new Date(startHourDate.getTime() + i * 3600 * 1000);
    const targetHour = targetDate.getHours();

    const isMorningPeak = targetHour >= 8 && targetHour <= 10;
    const isEveningPeak = targetHour >= 18 && targetHour <= 21;
    const isPeak = isMorningPeak || isEveningPeak;

    let trafficFactor: number;
    if (isEveningPeak) {
      trafficFactor = 1.35; // pico tarde intenso en Madrid
    } else if (isMorningPeak) {
      trafficFactor = 1.25; // pico mañana
    } else if (targetHour >= 23 || targetHour <= 6) {
      trafficFactor = 0.65; // madrugada limpia
    } else {
      trafficFactor = 0.95; // valle mediodía
    }

    // Tomar velocidad del viento de Open-Meteo si está disponible
    let targetWindSpeed = baseWindSpeed;
    let targetTemperature: number | undefined;

    if (weatherForecast && weatherForecast.length > i) {
      targetWindSpeed = weatherForecast[i].windSpeed;
      targetTemperature = Math.round(weatherForecast[i].temperature);
    }

    const windDispersionFactor = targetWindSpeed < 5 ? 1.2 : targetWindSpeed > 15 ? 0.8 : 1.0;

    const projectedNo2 = Math.round(basePollutants.no2 * trafficFactor * windDispersionFactor);
    const projectedPm25 = Math.round(basePollutants.pm25 * (1 + (trafficFactor - 1) * 0.7) * windDispersionFactor);

    const projectedAqiResult = calculateAqiAndDominant({
      pm25: projectedPm25,
      pm10: Math.round(basePollutants.pm10 * trafficFactor),
      no2: projectedNo2,
      o3: Math.max(10, Math.round(basePollutants.o3 * (isPeak ? 0.8 : 1.1))),
    });

    let explanation = 'Condiciones atmosféricas estables.';
    if (isPeak && targetWindSpeed < 5) {
      explanation = 'Hora punta de tráfico con viento en calma: dispersión deficiente.';
    } else if (isPeak) {
      explanation = 'Incremento por tráfico urbano de hora punta.';
    } else if (targetWindSpeed > 15) {
      explanation = 'Viento favorable que facilita la dispersión de contaminantes.';
    } else if (targetHour >= 22 || targetHour <= 6) {
      explanation = 'Descenso de emisiones por reducción del tráfico nocturno.';
    }

    const hourStr = `${targetHour.toString().padStart(2, '0')}:00`;

    forecast.push({
      hour: hourStr,
      timestamp: targetDate.toISOString(),
      aqi: projectedAqiResult.aqi,
      level: projectedAqiResult.level,
      no2: projectedNo2,
      pm25: projectedPm25,
      windSpeed: targetWindSpeed,
      temperature: targetTemperature,
      isPeakHour: isPeak,
      explanation,
    });
  }

  return forecast;
}
