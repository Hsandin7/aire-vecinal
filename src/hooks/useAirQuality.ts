import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AirQualityData, ForecastResponse, Recommendation, Zone, Profile } from '../types';
import { getZones, getAirQuality, getForecast, getRecommendations } from '../services/api';

export function useAirQuality(userProfileType: Profile = 'deportista') {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('madrid-castellana');
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar zonas iniciales
  useEffect(() => {
    let isMounted = true;
    getZones()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setZones(data);
          setSelectedZoneId((prev) => prev || data[0].id);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error al cargar zonas:', err);
          setError('No se pudieron cargar las zonas de la ciudad.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

  const loadData = useCallback(async (zoneId: string, demoMode: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const scenarioParam = demoMode ? 'demo' : undefined;

      const [aqData, fcData, recData] = await Promise.all([
        getAirQuality(zoneId, scenarioParam),
        getForecast(zoneId, scenarioParam),
        getRecommendations(zoneId, userProfileType, scenarioParam),
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
  }, [userProfileType]);

  // Cargar datos cada vez que cambia la zona o el modo demo
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
