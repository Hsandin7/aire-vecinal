import React from 'react';
import { useAirQuality } from '../hooks/useAirQuality';
import { useUserProfile } from '../hooks/useUserProfile';
import { AlertBanner } from '../components/AlertBanner';
import { RouteCard } from '../components/RouteCard';
import { MapView } from '../components/MapView';
import { AirQualityBadge } from '../components/AirQualityBadge';
import {
  Bell,
  MapPin,
  Trees,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const { profile } = useUserProfile();
  const {
    zones,
    routes,
    selectedZoneId,
    selectedZone,
    setSelectedZoneId,
    airQuality,
    recommendation,
    loading,
    error,
    isDemo,
  } = useAirQuality(profile.profile, profile.hasAsthma);

  const profileLabels: Record<string, string> = {
    deportista: 'Deportista / Runner',
    asmatico: 'Sensible / Asma',
    familia: 'Familia con niños',
    general: 'Población General',
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabecera */}
      <header className="bg-[#1F4E79] text-white p-4 pt-5 pb-5 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">
                Alertas y Rutas
              </h1>
              <span className="text-[10px] text-sky-200 font-medium">
                Recomendaciones y los 4 pulmones verdes de Madrid
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isDemo && (
              <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
            {airQuality && <AirQualityBadge level={airQuality.level} size="sm" />}
          </div>
        </div>

        {/* Info de perfil de usuario activo */}
        <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-2 px-3 flex items-center justify-between text-xs border border-white/15">
          <div className="flex items-center gap-2 truncate">
            <UserCheck size={15} className="text-emerald-400 shrink-0" />
            <span className="truncate">
              Perfil: <strong>{profileLabels[profile.profile] || 'General'}</strong>
              {profile.hasAsthma && ' (Con asma)'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-sky-200 truncate">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate max-w-[120px]">{selectedZone?.name}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-4 space-y-4 flex-1">
        {loading && !airQuality ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#1F4E79] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Calculando recomendaciones de salud...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
            <p className="font-bold">Error de conexión</p>
            <p>{error}</p>
          </div>
        ) : (
          recommendation && (
            <>
              {/* Aviso destacado */}
              <AlertBanner recommendation={recommendation} compact={false} />

              {/* Tarjeta de Ruta Alternativa Recomendada */}
              {recommendation.alternativeRoute ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Trees size={16} className="text-emerald-700" />
                      <h2 className="text-sm font-bold text-slate-800">
                        Ruta Verde Recomendada
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Mejor índice previsto: {recommendation.alternativeRoute.expectedLevel.toUpperCase()}
                    </span>
                  </div>

                  <RouteCard route={recommendation.alternativeRoute} />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                  <h3 className="text-xs font-bold text-slate-800">
                    No se requiere desvío en este momento
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    El aire en tu entorno es óptimo para realizar tu ruta habitual sin riesgo.
                  </p>
                </div>
              )}

              {/* Trazado de las 4 rutas en el Mapa Leaflet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#1F4E79]" />
                    <h2 className="text-sm font-bold text-slate-800">Mapa de las 4 Rutas de Madrid</h2>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {recommendation.alternativeRoute?.name || 'Rutas protegidas'}
                  </span>
                </div>

                <MapView
                  zones={zones}
                  allRoutes={routes}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={setSelectedZoneId}
                  currentLevel={airQuality?.level}
                  alternativeRoute={recommendation.alternativeRoute}
                  heightClass="h-72"
                />
              </div>

              {/* Las 4 Rutas Fijas de Madrid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Red de 4 Rutas Verdes en Madrid:
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {routes.map((r) => {
                    const isRecommended = recommendation.alternativeRoute?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        className={`p-2 rounded-xl border ${
                          isRecommended
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-100 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{r.name}</span>
                          {isRecommended && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                              Óptima
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          AQI {r.expectedAqi} • {r.distanceKm} km
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nota explicativa de salud urbana */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Criterio de recomendación de rutas</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  El motor de riesgo evalúa de forma continua el índice de calidad del aire previsto
                  en la estación más cercana a cada uno de los 4 grandes parques de Madrid y te
                  recomienda automáticamente la ruta con menor concentración de partículas y gases contaminantes.
                </p>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};
