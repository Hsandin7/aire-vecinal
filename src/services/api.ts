import type {
  AirQualityData,
  ForecastResponse,
  Recommendation,
  Zone,
  UserProfile,
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

export async function getZones(): Promise<Zone[]> {
  const res = await fetch(`${API_BASE}/zones`);
  const data = await handleResponse<{ zones: Zone[]; count: number }>(res);
  return data.zones;
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
  scenario?: string
): Promise<Recommendation> {
  const params = new URLSearchParams();
  if (zoneId) params.append('zone', zoneId);
  if (profile) params.append('profile', profile);
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/recommendations?${params.toString()}`);
  return handleResponse<Recommendation>(res);
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`);
  return handleResponse<UserProfile>(res);
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; profile: UserProfile }>(res);
  return json.profile;
}
