import type { IncomingMessage, ServerResponse } from 'http';
import { findStationById, getAirQualityData } from '../server/src/services/simulator.js';
import { generateExplainableForecast } from '../server/src/services/riskEngine.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const zoneId = url.searchParams.get('zone') || '28079008';
    const scenario = url.searchParams.get('scenario') || undefined;

    const station = findStationById(zoneId);
    const { airQuality, hourlyWeatherForecast } = await getAirQualityData(station, scenario);

    const forecast = generateExplainableForecast(
      airQuality.aqi,
      airQuality.pollutants,
      airQuality.weather.windSpeed,
      new Date(),
      hourlyWeatherForecast
    );

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        zoneId: station.id,
        zoneName: station.name,
        address: station.address,
        generatedAt: new Date().toISOString(),
        forecastHours: forecast,
        modelNotes:
          'Nowcasting físico-explicable a 6h basado en Open-Meteo y ciclo diario de tráfico rodado urbano del Ayuntamiento de Madrid.',
      })
    );
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Error al calcular previsión horaria' }));
  }
}
