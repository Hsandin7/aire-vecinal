import type { Level, Profile, PollutantValues, RecommendationResponse, ForecastHour, RouteAlternative } from '../types.js';
import { ALTERNATIVE_ROUTES } from '../data/mockData.js';

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
    // 0 a 50
    return Math.round((value / limits.good) * 50);
  } else if (value <= limits.moderate) {
    // 50 a 100
    const ratio = (value - limits.good) / (limits.moderate - limits.good);
    return Math.round(50 + ratio * 50);
  } else if (value <= limits.bad) {
    // 100 a 150
    const ratio = (value - limits.moderate) / (limits.bad - limits.moderate);
    return Math.round(100 + ratio * 50);
  } else {
    // > 150
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
 * Motor de riesgo (Risk Engine):
 * Implementa la lógica de decisión según el índice de calidad del aire y el perfil de sensibilidad.
 */
export function evaluateRisk(
  aqi: number,
  profile: Profile,
  hasAsthma = false,
  zoneId = 'madrid-castellana',
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

  // Lógica principal solicitada:
  // SI índice_aire > 100 (malo):
  //     SI usuario es sensible → alerta "Evita actividad al aire libre"
  //     SI NO → alerta "Reduce el ejercicio intenso"
  //     ofrecer ruta alternativa por zonas con menor contaminación
  // SI NO SI índice_aire entre 50 y 100 → aviso moderado "Precaución si eres sensible"
  // SI NO → mensaje "Aire bueno, ¡disfruta al aire libre!"

  if (aqi > 100) {
    timeWindow = '18:00 - 21:00';
    alternativeRoute = ALTERNATIVE_ROUTES[zoneId] || ALTERNATIVE_ROUTES['default'];

    if (sensitive) {
      alertTitle = 'Riesgo alto para tu perfil sensible';
      alertMessage = 'Evita actividad al aire libre';
      summary = `Calidad del aire desfavorable (AQI ${aqi}). Los grupos sensibles deben protegerse activamente.`;

      if (isDemo || profile === 'deportista' || profile === 'asmatico') {
        alertMessage =
          "Riesgo alto en tu zona de 18:00 a 21:00. Evita correr hoy; si sales, usa la ruta por el parque interior (índice 'Bueno').";
      }

      actionItems.push(
        'Suspende carreras, entrenamientos aeróbicos o paseos prolongados junto a avenidas.',
        'Mantén ventanas cerradas en las horas punta de tráfico (18:00 a 21:00).',
        `Si necesitas desplazarte a pie, utiliza la ruta alternativa protegida (${alternativeRoute.name}).`
      );
    } else {
      alertTitle = 'Calidad del aire no saludable';
      alertMessage = 'Reduce el ejercicio intenso';
      summary = `Niveles elevados de contaminantes (AQI ${aqi}). Conviene limitar esfuerzos prolongados.`;
      actionItems.push(
        'Modera la intensidad del ejercicio al aire libre.',
        'Evita arterias de tráfico pesado y prefiere zonas ajardinadas.',
        `Usa la ruta recomendada con un 40-50% menos de exposición.`
      );
    }
  } else if (aqi >= 50) {
    alertTitle = 'Calidad del aire aceptable';
    alertMessage = 'Precaución si eres sensible';
    summary = `Nivel moderado (AQI ${aqi}). Calidad aceptable para la población general con precaución para sensibles.`;
    actionItems.push(
      'Si tienes asma o sensibilidad respiratoria, monitoriza si notas irritación.',
      'Actividades al aire libre permitidas normalmente para el resto de la población.'
    );
  } else {
    alertTitle = 'Calidad del aire óptima';
    alertMessage = 'Aire bueno, ¡disfruta al aire libre!';
    summary = `Nivel excelente (AQI ${aqi}). Condiciones ideales para el deporte, paseos y ventilación natural.`;
    actionItems.push(
      'Momento ideal para realizar ejercicio y entrenamientos al aire libre.',
      'Abre ventanas para ventilar el hogar con aire limpio.'
    );
  }

  return {
    zoneId,
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
 * Modelo simple y explicable de predicción horaria (Nowcasting explicable a 6h).
 * NOTA DE ARQUITECTURA: Este algoritmo determinista actúa como sustituto (proxy white-box)
 * de un modelo predictivo de Machine Learning. Modela de forma transparente tres componentes físicos:
 * 1. Tendencia base e inercia atmosférica.
 * 2. Emisiones antropogénicas por horas punta de tráfico vehicular (08-10h y 18-21h).
 * 3. Factor de dispersión por viento local y estabilidad de la capa límite urbana.
 */
export function generateExplainableForecast(
  _baseAqi: number,
  basePollutants: PollutantValues,
  baseWindSpeed: number,
  startHourDate: Date = new Date()
): ForecastHour[] {
  const forecast: ForecastHour[] = [];

  for (let i = 1; i <= 6; i++) {
    const targetDate = new Date(startHourDate.getTime() + i * 3600 * 1000);
    const targetHour = targetDate.getHours();

    const isMorningPeak = targetHour >= 8 && targetHour <= 10;
    const isEveningPeak = targetHour >= 18 && targetHour <= 21;
    const isPeak = isMorningPeak || isEveningPeak;

    // Factores explicables:
    // - Viento bajo (<6 km/h) atrapa contaminantes (inversión térmica urbana)
    // - Hora punta aumenta emisiones de NO2 hasta un 40% y PM2.5 un 25%
    let trafficFactor: number;
    if (isEveningPeak) {
      trafficFactor = 1.35; // pico tarde intenso
    } else if (isMorningPeak) {
      trafficFactor = 1.25; // pico mañana
    } else if (targetHour >= 23 || targetHour <= 6) {
      trafficFactor = 0.65; // madrugada limpia
    } else {
      trafficFactor = 0.95; // valle mediodía
    }

    const windDispersionFactor = baseWindSpeed < 5 ? 1.2 : baseWindSpeed > 15 ? 0.8 : 1.0;

    const projectedNo2 = Math.round(basePollutants.no2 * trafficFactor * windDispersionFactor);
    const projectedPm25 = Math.round(basePollutants.pm25 * (1 + (trafficFactor - 1) * 0.7) * windDispersionFactor);

    // Calcular AQI proyectado
    const projectedAqiResult = calculateAqiAndDominant({
      pm25: projectedPm25,
      pm10: Math.round(basePollutants.pm10 * trafficFactor),
      no2: projectedNo2,
      o3: Math.max(10, Math.round(basePollutants.o3 * (isPeak ? 0.8 : 1.1))), // O3 titula con NO en horas punta
    });

    let explanation = 'Condiciones atmosféricas estables.';
    if (isPeak && baseWindSpeed < 5) {
      explanation = 'Hora punta de tráfico combinada con viento en calma: dispersión deficiente.';
    } else if (isPeak) {
      explanation = 'Incremento temporal debido al tráfico de hora punta.';
    } else if (baseWindSpeed > 15) {
      explanation = 'Viento favorable que favorece la dispersión rápida de partículas.';
    } else if (targetHour >= 22 || targetHour <= 6) {
      explanation = 'Descenso de emisiones por caída drástica del tráfico nocturno.';
    }

    const hourStr = `${targetHour.toString().padStart(2, '0')}:00`;

    forecast.push({
      hour: hourStr,
      timestamp: targetDate.toISOString(),
      aqi: projectedAqiResult.aqi,
      level: projectedAqiResult.level,
      no2: projectedNo2,
      pm25: projectedPm25,
      windSpeed: baseWindSpeed,
      isPeakHour: isPeak,
      explanation,
    });
  }

  return forecast;
}
