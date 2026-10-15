import type {
  AirQualityData,
  ForecastResponse,
  Recommendation,
  Zone,
  RouteAlternative,
  Profile,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export async function getZones(): Promise<{ zones: Zone[]; routes: RouteAlternative[] }> {
  const res = await fetch(`${API_BASE}/zones`);
  const data = await handleResponse<{
    zones: Zone[];
    routes: RouteAlternative[];
    count: number;
    attribution?: { openData: string; weather: string };
  }>(res);
  return { zones: data.zones, routes: data.routes || [] };
}

export async function getAirQuality(zoneId: string, scenario?: string): Promise<AirQualityData> {
  const params = new URLSearchParams();
  if (zoneId) params.append('zone', zoneId);
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/air-quality?${params.toString()}`);
  return handleResponse<AirQualityData>(res);
}

export async function getForecast(zoneId: string, scenario?: string): Promise<ForecastResponse> {
  const params = new URLSearchParams();
  if (zoneId) params.append('zone', zoneId);
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/forecast?${params.toString()}`);
  return handleResponse<ForecastResponse>(res);
}

export async function getRecommendations(
  zoneId: string,
  profile?: Profile,
  hasAsthma?: boolean,
  scenario?: string
): Promise<Recommendation> {
  const params = new URLSearchParams();
  if (zoneId) params.append('zone', zoneId);
  if (profile) params.append('profile', profile);
  if (hasAsthma !== undefined) params.append('asthma', String(hasAsthma));
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/recommendations?${params.toString()}`);
  return handleResponse<Recommendation>(res);
}
