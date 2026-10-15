import type { Zone, RouteAlternative, UserPreferences } from '../types.js';

export const MADRID_ZONES: Zone[] = [
  {
    id: 'madrid-castellana',
    name: 'Chamartín - Paseo de la Castellana',
    neighborhood: 'Chamartín',
    city: 'Madrid',
    coordinates: [40.4530, -3.6883],
    trafficLevel: 'alto',
    type: 'avenida',
  },
  {
    id: 'madrid-retiro',
    name: 'Retiro - Menéndez Pelayo',
    neighborhood: 'Retiro',
    city: 'Madrid',
    coordinates: [40.4153, -3.6775],
    trafficLevel: 'medio',
    type: 'residencial',
  },
  {
    id: 'madrid-chamberi',
    name: 'Chamberí - Santa Engracia',
    neighborhood: 'Chamberí',
    city: 'Madrid',
    coordinates: [40.4350, -3.7000],
    trafficLevel: 'alto',
    type: 'avenida',
  },
  {
    id: 'madrid-rio',
    name: 'Arganzuela - Madrid Río',
    neighborhood: 'Arganzuela',
    city: 'Madrid',
    coordinates: [40.3980, -3.7030],
    trafficLevel: 'bajo',
    type: 'parque',
  },
  {
    id: 'madrid-dehesa',
    name: 'Moncloa - Dehesa de la Villa',
    neighborhood: 'Moncloa-Aravaca',
    city: 'Madrid',
    coordinates: [40.4600, -3.7250],
    trafficLevel: 'bajo',
    type: 'parque',
  },
];

export const ALTERNATIVE_ROUTES: Record<string, RouteAlternative> = {
  'madrid-castellana': {
    id: 'route-parque-berlin',
    name: 'Ruta Parque de Berlín e Interior Residencial',
    description: 'Trazado alternativo a 300m del eje Castellana. La barrera arbolada reduce partículas en suspensión más de un 40%.',
    expectedAqi: 32,
    expectedLevel: 'bueno',
    distanceKm: 3.4,
    exposureReductionPercentage: 45,
    path: [
      [40.4530, -3.6883],
      [40.4515, -3.6850],
      [40.4500, -3.6800],
      [40.4510, -3.6740],
      [40.4525, -3.6720],
    ],
  },
  'madrid-retiro': {
    id: 'route-interior-retiro',
    name: 'Ruta Sendas Interiores de El Retiro',
    description: 'Circuito por el corazón arbolado del parque, lejos de la calzada de Menéndez Pelayo y O\'Donnell.',
    expectedAqi: 28,
    expectedLevel: 'bueno',
    distanceKm: 4.1,
    exposureReductionPercentage: 55,
    path: [
      [40.4153, -3.6775],
      [40.4160, -3.6810],
      [40.4175, -3.6835],
      [40.4190, -3.6815],
      [40.4180, -3.6760],
    ],
  },
  'default': {
    id: 'route-parque-interior',
    name: 'Ruta Parque Interior Protegido',
    description: 'Itinerario por calles peatonales y parque interior arbolado con índice excelente.',
    expectedAqi: 25,
    expectedLevel: 'bueno',
    distanceKm: 3.0,
    exposureReductionPercentage: 50,
    path: [
      [40.4550, -3.6900],
      [40.4565, -3.6940],
      [40.4580, -3.6970],
      [40.4600, -3.7010],
    ],
  },
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  profile: 'deportista',
  hasAsthma: true,
  favoriteZones: ['madrid-castellana'],
  alertTypes: 'all',
  notificationHours: {
    start: '07:30',
    end: '22:00',
  },
};
