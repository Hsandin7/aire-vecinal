import React from 'react';
import { useAirQuality } from '../hooks/useAirQuality';
import { useUserProfile } from '../hooks/useUserProfile';
import { PollutantCard } from '../components/PollutantCard';
import { HourlyChart } from '../components/HourlyChart';
import { AirQualityBadge } from '../components/AirQualityBadge';
import {
  Activity,
  Layers,
  Sparkles,
  Cpu,
  MapPin,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Detail: React.FC = () => {
  const { profile } = useUserProfile();
  const {
    selectedZone,
    airQuality,
    forecast,
    loading,
    error,
    isDemo,
  } = useAirQuality(profile.profile, profile.hasAsthma);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabecera */}
      <header className="bg-[#1F4E79] text-white p-4 pt-5 pb-5 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">
                Detalle Ambiental
              </h1>
              <span className="text-[10px] text-sky-200 font-medium">
                Red de Calidad del Aire de Madrid
              </span>
            </div>
          </div>
          {airQuality && <AirQualityBadge level={airQuality.level} size="sm" />}
        </div>

        {/* Estación de Madrid */}
        <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-between text-xs border border-white/15">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={14} className="text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold block truncate">
                {selectedZone?.name} (#{selectedZone?.code})
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                {selectedZone?.address}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {airQuality?.dataSource === 'madrid-real' ? (
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <Radio size={9} className="animate-pulse" />
                <span>En vivo</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                Simulado
              </span>
            )}
            {isDemo && (
              <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-4 space-y-4 flex-1">
        {loading && !airQuality ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#1F4E79] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Cargando sensores de la estación...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
            <p className="font-bold">Error al cargar datos</p>
            <p>{error}</p>
          </div>
        ) : (
          airQuality && (
            <>
              {/* Contaminante dominante */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Factor Crítico
                    </span>
                    <h2 className="text-xs font-bold text-slate-800">
                      Contaminante dominante:{' '}
                      <span className="text-[#1F4E79]">
                        {airQuality.dominantPollutant.toUpperCase()}
                      </span>
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                  AQI {airQuality.aqi}
                </span>
              </div>

              {/* Grid de Contaminantes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers size={16} className="text-[#1F4E79]" />
                    <h2 className="text-sm font-bold text-slate-800">
                      Parámetros Medidos (µg/m³)
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Guías OMS 24h
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PollutantCard
                    pollutantKey="no2"
                    value={airQuality.pollutants.no2}
                  />
                  <PollutantCard
                    pollutantKey="pm25"
                    value={airQuality.pollutants.pm25}
                  />
                  <PollutantCard
                    pollutantKey="pm10"
                    value={airQuality.pollutants.pm10}
                  />
                  <PollutantCard
                    pollutantKey="o3"
                    value={airQuality.pollutants.o3}
                  />
                </div>
              </div>

              {/* Gráfica de previsión horaria alimentada con Open-Meteo */}
              {forecast && <HourlyChart data={forecast.forecastHours} />}

              {/* Tarjeta de modelo explicable */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-[#1F4E79] rounded-lg">
                    <Cpu size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Nowcasting Explicable (Open-Meteo + Tráfico Madrid)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  El modelo físico-estadístico determinista calcula la evolución horaria combinando:
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1 pl-1 list-disc list-inside">
                  <li>
                    <strong>Velocidad del viento prevista (Open-Meteo):</strong> vientos en calma
                    (&lt;5 km/h) incrementan la concentración de partículas.
                  </li>
                  <li>
                    <strong>Ciclo de tráfico de Madrid:</strong> picos de emisiones en horas punta
                    (08:00–10:00 y 18:00–21:00).
                  </li>
                  <li>
                    <strong>Inercia atmosférica urbana:</strong> retención por cañones urbanos de edificios.
                  </li>
                </ul>
              </div>

              {/* Botón hacia Alertas */}
              <Link
                to="/alerts"
                className="w-full bg-[#1F4E79] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm hover:bg-[#163a5c] transition-colors"
              >
                <span>Ver rutas verdes alternativas y consejos</span>
                <ChevronRight size={16} />
              </Link>
            </>
          )
        )}
      </main>
    </div>
  );
};
