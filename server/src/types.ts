export type Level = 'bueno' | 'moderado' | 'malo' | 'muy_malo';

export type Profile = 'general' | 'deportista' | 'asmatico' | 'familia';

export interface PollutantValues {
  pm25: number;   // µg/m³
  pm10: number;   // µg/m³
  no2: number;    // µg/m³
  o3: number;     // µg/m³
}

export interface WeatherValues {
  windSpeed: number;      // km/h
  temperature: number;    // °C
  humidity: number;       // %
  windDirection?: string; // e.g. "NE", "SO"
}

export interface AirQualityResponse {
  zoneId: string;
  zoneName: string;
  timestamp: string;
  aqi: number;
  level: Level;
  dominantPollutant: 'pm25' | 'pm10' | 'no2' | 'o3';
  pollutants: PollutantValues;
  weather: WeatherValues;
  dataSource: 'simulated' | 'open-meteo';
  scenario?: string;
}

export interface ForecastHour {
  hour: string;          // e.g. "18:00"
  timestamp: string;
  aqi: number;
  level: Level;
  no2: number;
  pm25: number;
  windSpeed: number;
  isPeakHour: boolean;
  explanation: string;
}

export interface RouteAlternative {
  id: string;
  name: string;
  description: string;
  expectedAqi: number;
  expectedLevel: Level;
  distanceKm: number;
  exposureReductionPercentage: number;
  path: [number, number][]; // LatLng points for Leaflet polyline
}

export interface RecommendationResponse {
  zoneId: string;
  profile: Profile;
  aqi: number;
  level: Level;
  summary: string;
  alertTitle: string;
  alertMessage: string;
  timeWindow?: string;
  actionItems: string[];
  alternativeRoute?: RouteAlternative;
}

export interface Zone {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  coordinates: [number, number]; // [lat, lng]
  trafficLevel: 'alto' | 'medio' | 'bajo';
  type: 'avenida' | 'residencial' | 'parque';
}

export interface UserPreferences {
  profile: Profile;
  hasAsthma: boolean;
  favoriteZones: string[];
  alertTypes: 'all' | 'severe_only';
  notificationHours: {
    start: string; // "08:00"
    end: string;   // "21:00"
  };
}
