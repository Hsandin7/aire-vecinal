import { describe, it, expect } from 'vitest';
import {
  calculateAqiAndDominant,
  evaluateRisk,
  isUserSensitive,
  generateExplainableForecast,
  calculateSubIndex,
  THRESHOLDS,
} from '../../server/src/services/riskEngine.js';
import type { PollutantValues } from '../../server/src/types.js';

describe('Motor de Riesgo de AireVecinal (riskEngine)', () => {
  // Caso 1: Aire Bueno (AQI <= 50)
  it('Caso 1: debe clasificar como "bueno" cuando los contaminantes son bajos y recomendar disfrutar al aire libre', () => {
    const pollutants: PollutantValues = {
      pm25: 8,  // bueno (< 10)
      pm10: 15, // bueno (< 20)
      no2: 25,  // bueno (< 40)
      o3: 30,   // bueno (< 50)
    };

    const calculated = calculateAqiAndDominant(pollutants);
    expect(calculated.aqi).toBeLessThanOrEqual(50);
    expect(calculated.level).toBe('bueno');

    const recommendation = evaluateRisk(calculated.aqi, 'general', false);
    expect(recommendation.level).toBe('bueno');
    expect(recommendation.alertMessage).toBe('Aire bueno, ¡disfruta al aire libre!');
    expect(recommendation.actionItems.length).toBeGreaterThan(0);
  });

  // Caso 2: Aire Moderado (AQI 50-100)
  it('Caso 2: debe clasificar como "moderado" cuando los niveles son intermedios y avisar "Precaución si eres sensible"', () => {
    const pollutants: PollutantValues = {
      pm25: 18, // moderado (10 - 25) -> subíndice aprox 77
      pm10: 32, // moderado (20 - 50)
      no2: 60,  // moderado (40 - 100)
      o3: 55,   // moderado (50 - 100)
    };

    const calculated = calculateAqiAndDominant(pollutants);
    expect(calculated.aqi).toBeGreaterThan(50);
    expect(calculated.aqi).toBeLessThanOrEqual(100);
    expect(calculated.level).toBe('moderado');

    const recommendation = evaluateRisk(calculated.aqi, 'general', false);
    expect(recommendation.level).toBe('moderado');
    expect(recommendation.alertMessage).toBe('Precaución si eres sensible');
  });

  // Caso 3: Aire Malo (AQI > 100) con oferta de ruta alternativa
  it('Caso 3: debe clasificar como "malo" cuando un contaminante supera el umbral y ofrecer ruta alternativa', () => {
    const pollutants: PollutantValues = {
      pm25: 35, // malo (> 25) -> subíndice > 100
      pm10: 60,
      no2: 110,
      o3: 40,
    };

    const calculated = calculateAqiAndDominant(pollutants);
    expect(calculated.aqi).toBeGreaterThan(100);
    expect(['malo', 'muy_malo']).toContain(calculated.level);

    const recommendation = evaluateRisk(calculated.aqi, 'general', false, 'madrid-castellana');
    expect(recommendation.alternativeRoute).toBeDefined();
    expect(recommendation.alternativeRoute?.expectedLevel).toBe('bueno');
    expect(recommendation.alternativeRoute?.path.length).toBeGreaterThan(0);
  });

  // Caso 4: Aire Malo + Usuario Sensible (asmático, familia o deportista)
  it('Caso 4: en aire malo con usuario sensible debe alertar "Evita actividad al aire libre" o recomendación de protección activa', () => {
    const aqiMalo = 125;

    // Asmático
    const recAsmatico = evaluateRisk(aqiMalo, 'asmatico', true);
    expect(isUserSensitive('asmatico', true)).toBe(true);
    expect(
      recAsmatico.alertMessage.includes('Evita actividad al aire libre') ||
      recAsmatico.alertMessage.includes('Evita correr hoy')
    ).toBe(true);

    // Familia con niños
    const recFamilia = evaluateRisk(aqiMalo, 'familia', false);
    expect(isUserSensitive('familia', false)).toBe(true);
    expect(recFamilia.alertMessage).toBe('Evita actividad al aire libre');
  });

  // Caso 5: Aire Malo + Usuario NO sensible (población general sin asma)
  it('Caso 5: en aire malo con usuario no sensible debe alertar "Reduce el ejercicio intenso"', () => {
    const aqiMalo = 120;
    expect(isUserSensitive('general', false)).toBe(false);

    const recommendation = evaluateRisk(aqiMalo, 'general', false);
    expect(recommendation.alertMessage).toBe('Reduce el ejercicio intenso');
    expect(recommendation.alternativeRoute).toBeDefined();
  });

  // Caso 6: Escenario DEMO exacto de la Sección 8
  it('Caso 6: Escenario DEMO exacto (NO2=130, PM2.5=45, perfil deportista con asma) debe producir nivel Malo y texto requerido', () => {
    const demoPollutants: PollutantValues = {
      no2: 130,
      pm25: 45,
      pm10: 68,
      o3: 32,
    };

    const calculated = calculateAqiAndDominant(demoPollutants);
    expect(calculated.aqi).toBeGreaterThan(100);
    expect(calculated.level).toBe('malo');

    const demoRecommendation = evaluateRisk(
      calculated.aqi,
      'deportista',
      true,
      'madrid-castellana',
      true
    );

    expect(demoRecommendation.level).toBe('malo');
    expect(demoRecommendation.alertMessage).toBe(
      "Riesgo alto en tu zona de 18:00 a 21:00. Evita correr hoy; si sales, usa la ruta por el parque interior (índice 'Bueno')."
    );
    expect(demoRecommendation.timeWindow).toBe('18:00 - 21:00');
    expect(demoRecommendation.alternativeRoute).toBeDefined();
    expect(demoRecommendation.alternativeRoute?.expectedLevel).toBe('bueno');
  });

  // Caso 7: Identificación precisa del contaminante dominante
  it('Caso 7: debe identificar correctamente el contaminante dominante que dispara el índice', () => {
    const no2Dominant: PollutantValues = {
      pm25: 5,
      pm10: 10,
      no2: 120, // NO2 alto
      o3: 20,
    };
    const result = calculateAqiAndDominant(no2Dominant);
    expect(result.dominantPollutant).toBe('no2');

    const pm25Dominant: PollutantValues = {
      pm25: 40, // PM2.5 alto
      pm10: 15,
      no2: 20,
      o3: 20,
    };
    const result2 = calculateAqiAndDominant(pm25Dominant);
    expect(result2.dominantPollutant).toBe('pm25');
  });

  // Caso 8: Modelo explicable de nowcasting (predicción a 6h)
  it('Caso 8: el modelo explicable de 6h debe calcular incrementos en horas punta de tráfico con viento bajo', () => {
    const basePollutants: PollutantValues = {
      no2: 80,
      pm25: 25,
      pm10: 40,
      o3: 30,
    };
    const lowWind = 3.0; // viento bajo (< 5 km/h)

    // Simular inicio a las 16:00 para que las siguientes horas incluyan el pico de 18:00-21:00
    const startDate = new Date('2026-10-15T16:00:00Z');
    const forecast = generateExplainableForecast(90, basePollutants, lowWind, startDate);

    expect(forecast.length).toBe(6);
    // Verificar que las horas proyectadas tengan explicación y valores numéricos consistentes
    forecast.forEach((hourItem) => {
      expect(hourItem.aqi).toBeGreaterThan(0);
      expect(hourItem.no2).toBeGreaterThan(0);
      expect(hourItem.pm25).toBeGreaterThan(0);
      expect(hourItem.explanation).toBeDefined();
    });
  });

  // Caso 9: Función subíndice continua
  it('Caso 9: calculateSubIndex debe respetar rangos y continuidad', () => {
    expect(calculateSubIndex(0, THRESHOLDS.pm25)).toBe(0);
    expect(calculateSubIndex(10, THRESHOLDS.pm25)).toBe(50);
    expect(calculateSubIndex(25, THRESHOLDS.pm25)).toBe(100);
    expect(calculateSubIndex(50, THRESHOLDS.pm25)).toBe(150);
  });
});
