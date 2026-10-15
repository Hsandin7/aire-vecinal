import React, { useState } from 'react';
import { useAirQuality } from '../hooks/useAirQuality';
import { useUserProfile } from '../hooks/useUserProfile';
import { AirQualityBadge } from '../components/AirQualityBadge';
import { AlertBanner } from '../components/AlertBanner';
import { MapView } from '../components/MapView';
import { NotificationToast } from '../components/NotificationToast';
import { getLevelMetadata } from '../utils/airQuality';
import {
  Wind,
  Thermometer,
  Droplets,
  Zap,
  RotateCcw,
  MapPin,
  ChevronDown,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';

export const Home: React.FC = () => {
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
    toggleDemo,
    refresh,
  } = useAirQuality(profile.profile, profile.hasAsthma);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSimulateEpisode = () => {
    const nextState = !isDemo;
    toggleDemo(nextState);

    if (nextState) {
      // Fijar la estación Escuelas Aguirre (código 28079008) según la sección 5
      setSelectedZoneId('28079008');

      const demoNotification =
        'Riesgo alto en tu zona de 18:00 a 21:00. Evita correr hoy; si sales, usa la ruta por el Retiro (índice Bueno).';
      setToastMessage(demoNotification);

      // Notificación nativa si está concedido el permiso
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Alerta AireVecinal - Madrid', {
            body: demoNotification,
            icon: '/vite.svg',
          });
        } catch {
          // Ignorar fallo de notificación de sistema
        }
      }
    } else {
      setToastMessage(null);
    }
  };

  const level = airQuality?.level || 'bueno';
  const meta = getLevelMetadata(level);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toast de notificación emergente cuando se simula el episodio */}
      {toastMessage && (
        <NotificationToast
          title="Alerta Sanitaria Madrid"
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Cabecera */}
      <header className="bg-[#1F4E79] text-white p-4 pt-5 pb-6 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black text-emerald-400">
              AV
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">AireVecinal Madrid</h1>
              <span className="text-[10px] text-sky-200 font-medium">
                Red Municipal y Rutas Saludables
              </span>
            </div>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Actualizar datos"
            aria-label="Actualizar datos"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Selector de las 24 Estaciones del Ayuntamiento de Madrid */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between border border-white/15">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin size={18} className="text-emerald-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-sky-200 font-bold uppercase block leading-none">
                Estación de control activa
              </span>
              <span className="text-xs font-bold truncate block text-white">
                {selectedZone?.name || 'Escuelas Aguirre'}
              </span>
              <span className="text-[10px] text-slate-300 truncate block">
                {selectedZone?.address}
              </span>
            </div>
          </div>
          <div className="relative shrink-0">
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              aria-label="Seleccionar estación de calidad del aire de Madrid"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="text-slate-800">
                  {z.name} (#{z.code})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              <span>Cambiar</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-4 space-y-4 -mt-3 flex-1">
        {/* Botón Destacado: Simular Episodio de Contaminación en Escuelas Aguirre */}
        <div className="bg-linear-to-r from-amber-500/10 to-rose-500/10 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDemo ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-800'}`}>
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800">
                {isDemo ? 'Episodio Demo Activo' : 'Simular episodio (Escuelas Aguirre)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isDemo
                  ? 'NO₂: 130 µg/m³ • PM2.5: 45 µg/m³ • Viento bajo'
                  : 'Fuerza episodio crítico para deportista con asma'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulateEpisode}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
              isDemo
                ? 'bg-slate-800 text-white hover:bg-slate-900'
                : 'bg-[#1F4E79] text-white hover:bg-[#163a5c]'
            }`}
          >
            {isDemo ? 'Restablecer' : 'Simular episodio'}
          </button>
        </div>

        {loading && !airQuality ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#1F4E79] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Consultando estación de Madrid...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
            <p className="font-bold">Error de conexión</p>
            <p>{error}</p>
          </div>
        ) : (
          airQuality && (
            <>
              {/* Tarjeta Hero del Índice Actual */}
              <div
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden"
                style={{
                  borderTopWidth: '6px',
                  borderTopColor: meta.colorHex,
                }}
              >
                {/* Etiqueta de Origen de Datos (Tiempo Real vs Simulado) */}
                <div className="flex items-center gap-1.5 mb-2">
                  {airQuality.dataSource === 'madrid-real' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Radio size={10} className="animate-pulse text-emerald-600" />
                      <span>Datos en tiempo real (Ayto. Madrid)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <span>Datos simulados</span>
                    </span>
                  )}
                  {isDemo && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      Demo
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Índice de Calidad del Aire (AQI)
                </span>

                <div className="my-1 flex flex-col items-center">
                  <span
                    className="text-6xl font-black tracking-tight"
                    style={{ color: meta.colorHex }}
                  >
                    {airQuality.aqi}
                  </span>
                  <div className="mt-1">
                    <AirQualityBadge level={airQuality.level} size="lg" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium max-w-[280px] mt-2">
                  {meta.description}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <Sparkles size={12} className="text-[#1F4E79]" />
                  <span>
                    Contaminante dominante:{' '}
                    <strong className="text-slate-800">
                      {airQuality.dominantPollutant.toUpperCase()}
                    </strong>
                  </span>
                </div>

                {/* Métricas meteorológicas de Open-Meteo */}
                <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-slate-400 text-xs mb-0.5">
                      <Wind size={13} />
                      <span className="text-[10px] font-bold uppercase">Viento</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {airQuality.weather.windSpeed} km/h
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {airQuality.weather.windSpeed < 5 ? 'Calma' : 'Dispersión OK'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-slate-400 text-xs mb-0.5">
                      <Thermometer size={13} />
                      <span className="text-[10px] font-bold uppercase">Temp.</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {airQuality.weather.temperature} °C
                    </span>
                    <span className="text-[10px] text-slate-400">Open-Meteo</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-slate-400 text-xs mb-0.5">
                      <Droplets size={13} />
                      <span className="text-[10px] font-bold uppercase">Humedad</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {airQuality.weather.humidity}%
                    </span>
                    <span className="text-[10px] text-slate-400">Relativa</span>
                  </div>
                </div>
              </div>

              {/* Banner de alerta y recomendación si hay riesgo */}
              {recommendation && (
                <AlertBanner recommendation={recommendation} compact />
              )}

              {/* Sección de Mapa interactivo con las 4 rutas fijas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#1F4E79]" />
                    <h2 className="text-sm font-bold text-slate-800">Estaciones y 4 Rutas de Madrid</h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {zones.length} estaciones
                  </span>
                </div>

                <MapView
                  zones={zones}
                  allRoutes={routes}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={setSelectedZoneId}
                  currentLevel={airQuality.level}
                  alternativeRoute={recommendation?.alternativeRoute}
                  heightClass="h-56"
                />
              </div>

              {/* Tip de salud urbana */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-sky-900">
                <Info size={16} className="text-[#1F4E79] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  La app compara las 4 grandes zonas verdes de Madrid (<strong>El Retiro</strong>,{' '}
                  <strong>Madrid Río</strong>, <strong>Casa de Campo</strong> y{' '}
                  <strong>Parque del Oeste</strong>) para recomendarte la que presente el mejor índice previsto.
                </p>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};
