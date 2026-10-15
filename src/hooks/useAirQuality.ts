import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AirQualityData, ForecastResponse, Recommendation, Zone, RouteAlternative, Profile } from '../types';
import { getZones, getAirQuality, getForecast, getRecommendations } from '../services/api';

export function useAirQuality(userProfileType: Profile = 'deportista', hasAsthma = true) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [routes, setRoutes] = useState<RouteAlternative[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('28079008'); // Escuelas Aguirre
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estaciones y rutas iniciales
  useEffect(() => {
    let isMounted = true;
    getZones()
      .then((data) => {
        if (isMounted) {
          setZones(data.zones);
          setRoutes(data.routes);
          setSelectedZoneId((prev) => prev || data.zones[1]?.id || '28079008');
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error al cargar estaciones de Madrid:', err);
          setError('No se pudieron cargar las estaciones de Madrid.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[1] || zones[0];
  }, [zones, selectedZoneId]);

  const loadData = useCallback(async (zoneId: string, demoMode: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const scenarioParam = demoMode ? 'demo' : undefined;

      const [aqData, fcData, recData] = await Promise.all([
        getAirQuality(zoneId, scenarioParam),
        getForecast(zoneId, scenarioParam),
        getRecommendations(zoneId, userProfileType, hasAsthma, scenarioParam),
      ]);

      setAirQuality(aqData);
      setForecast(fcData);
      setRecommendation(recData);
    } catch (err: unknown) {
      console.error('Error al obtener datos de calidad del aire:', err);
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userProfileType, hasAsthma]);

  useEffect(() => {
    if (selectedZoneId) {
      loadData(selectedZoneId, isDemo);
    }
  }, [selectedZoneId, isDemo, loadData]);

  const toggleDemo = useCallback((forced?: boolean) => {
    setIsDemo((prev) => (typeof forced === 'boolean' ? forced : !prev));
  }, []);

  const refresh = useCallback(() => {
    if (selectedZoneId) {
      loadData(selectedZoneId, isDemo);
    }
  }, [selectedZoneId, isDemo, loadData]);

  return {
    zones,
    routes,
    selectedZoneId,
    selectedZone,
    setSelectedZoneId,
    airQuality,
    forecast,
    recommendation,
    loading,
    error,
    isDemo,
    toggleDemo,
    refresh,
  };
}
