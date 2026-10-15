import type { Zone, RouteAlternative, UserPreferences } from '../types.js';
import estacionesJson from './estaciones.json' with { type: 'json' };

export const MADRID_STATIONS: Zone[] = (estacionesJson as unknown as Array<{
  id: string;
  code: string;
  name: string;
  address: string;
  type: string;
  coordinates: [number, number];
}>).map((est) => {
  let trafficLevel: 'alto' | 'medio' | 'bajo' = 'medio';
  if (est.type === 'urbana_trafico') trafficLevel = 'alto';
  else if (est.type === 'suburbana') trafficLevel = 'bajo';

  return {
    id: est.id,
    code: est.code,
    name: est.name,
    address: est.address,
    neighborhood: est.name,
    city: 'Madrid',
    coordinates: est.coordinates,
    trafficLevel,
    type: est.type as 'urbana_trafico' | 'urbana_fondo' | 'suburbana',
  };
});

// Alias para compatibilidad con código existente
export const MADRID_ZONES = MADRID_STATIONS;

/**
 * 4 Rutas Fijas Oficiales de AireVecinal en Madrid:
 * 1. El Retiro
 * 2. Madrid Río
 * 3. Casa de Campo
 * 4. Parque del Oeste
 */
export const FIXED_ROUTES: RouteAlternative[] = [
  {
    id: 'route-retiro',
    name: 'Ruta por el Retiro',
    description: 'Circuito interior arbolado por el Parque de El Retiro (Paseo de Coches y Jardines de Cecilio Rodríguez), aislado del tráfico de las avenidas perimetrales.',
    expectedAqi: 28,
    expectedLevel: 'bueno',
    distanceKm: 4.2,
    exposureReductionPercentage: 55,
    nearestStationCode: '28079049', // Parque del Retiro (también lindante con Escuelas Aguirre 28079008)
    nearestStationName: 'Parque del Retiro',
    path: [
      [40.4200, -3.6820],
      [40.4180, -3.6800],
      [40.4150, -3.6820],
      [40.4135, -3.6850],
      [40.4160, -3.6875],
      [40.4190, -3.6850],
    ],
  },
  {
    id: 'route-madrid-rio',
    name: 'Ruta Madrid Río',
    description: 'Senda biosaludable y ciclable a orillas del río Manzanares con flujo constante de aire fresco y alejada de las arterias viales.',
    expectedAqi: 35,
    expectedLevel: 'bueno',
    distanceKm: 5.0,
    exposureReductionPercentage: 45,
    nearestStationCode: '28079018', // Farolillo
    nearestStationName: 'Farolillo (Arganzuela)',
    path: [
      [40.4045, -3.7190],
      [40.4010, -3.7130],
      [40.3975, -3.7055],
      [40.3940, -3.6980],
    ],
  },
  {
    id: 'route-casa-campo',
    name: 'Ruta Casa de Campo',
    description: 'El mayor bosque urbano de Madrid. Máxima protección natural frente a partículas en suspensión y óxidos de nitrógeno.',
    expectedAqi: 22,
    expectedLevel: 'bueno',
    distanceKm: 6.5,
    exposureReductionPercentage: 65,
    nearestStationCode: '28079024', // Casa de Campo
    nearestStationName: 'Casa de Campo',
    path: [
      [40.4225, -3.7420],
      [40.4195, -3.7470],
      [40.4160, -3.7520],
      [40.4125, -3.7580],
    ],
  },
  {
    id: 'route-parque-oeste',
    name: 'Ruta Parque del Oeste',
    description: 'Itinerario por la rosaleda y jardines en pendiente hacia la Moncloa, con excelente dispersión atmosférica y brisa del noroeste.',
    expectedAqi: 30,
    expectedLevel: 'bueno',
    distanceKm: 3.8,
    exposureReductionPercentage: 50,
    nearestStationCode: '28079004', // Plaza de España
    nearestStationName: 'Plaza de España / Moncloa',
    path: [
      [40.4265, -3.7180],
      [40.4305, -3.7225],
      [40.4345, -3.7260],
      [40.4385, -3.7295],
    ],
  },
];

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  profile: 'deportista',
  hasAsthma: true,
  favoriteZones: ['28079008'], // Escuelas Aguirre por defecto
  alertTypes: 'all',
  notificationHours: {
    start: '07:30',
    end: '22:00',
  },
};
