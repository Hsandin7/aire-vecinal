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
    selectedZoneId,
    selectedZone,
    setSelectedZoneId,
    airQuality,
    recommendation,
    loading,
    error,
    isDemo,
  } = useAirQuality(profile.profile);

  const profileLabels: Record<string, string> = {
    deportista: 'Deportista',
    asmatico: 'Sensible / Asma',
    familia: 'Familia con niños',
    general: 'General',
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
                Recomendaciones y desvíos limpios
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
          <div className="flex items-center gap-1 text-[11px] text-sky-200">
            <MapPin size={12} />
            <span className="truncate max-w-[100px]">{selectedZone?.neighborhood}</span>
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

              {/* Tarjeta de Ruta Alternativa */}
              {recommendation.alternativeRoute ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Trees size={16} className="text-emerald-700" />
                      <h2 className="text-sm font-bold text-slate-800">
                        Ruta Alternativa Recomendada
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Aire Bueno
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

              {/* Trazado de la ruta sobre el Mapa Leaflet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#1F4E79]" />
                    <h2 className="text-sm font-bold text-slate-800">Trazado Protegido en Mapa</h2>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {recommendation.alternativeRoute?.name || 'Mapa del barrio'}
                  </span>
                </div>

                <MapView
                  zones={zones}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={setSelectedZoneId}
                  currentLevel={airQuality?.level}
                  alternativeRoute={recommendation.alternativeRoute}
                  heightClass="h-72"
                />
              </div>

              {/* Nota científica / urbana */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Por qué funciona la ruta interior</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Separarse 200–300 metros de una vía con tráfico denso y transitar junto a arbolado
                  urbano reduce la inhalación de partículas ultrafinas y dióxido de nitrógeno hasta en
                  un 50%, evitando los puntos de mayor estancamiento de gases de combustión.
                </p>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};
