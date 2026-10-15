import React from 'react';
import type { RouteAlternative } from '../types';
import { AirQualityBadge } from './AirQualityBadge';
import { Navigation, ShieldCheck, Trees } from 'lucide-react';

interface RouteCardProps {
  route: RouteAlternative;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route }) => {
  return (
    <div className="bg-white border-2 border-emerald-400/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Trees size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Ruta Alternativa Saludable
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{route.name}</h3>
          </div>
        </div>
        <AirQualityBadge level={route.expectedLevel} size="sm" />
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{route.description}</p>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Índice Previsto</span>
          <span className="text-sm font-extrabold text-emerald-700">AQI {route.expectedAqi}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Exposición</span>
          <span className="text-sm font-extrabold text-[#1F4E79]">
            -{route.exposureReductionPercentage}%
          </span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Distancia</span>
          <span className="text-sm font-extrabold text-slate-800">{route.distanceKm} km</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Protegida contra picos de NO₂</span>
        </div>
        <div className="flex items-center gap-1 text-[#1F4E79] font-semibold text-xs">
          <Navigation size={14} />
          <span>Ver trazado en mapa</span>
        </div>
      </div>
    </div>
  );
};
