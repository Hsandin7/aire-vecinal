import React from 'react';
import { POLLUTANTS_INFO } from '../utils/airQuality';
import { Info } from 'lucide-react';

interface PollutantCardProps {
  pollutantKey: 'pm25' | 'pm10' | 'no2' | 'o3';
  value: number;
}

export const PollutantCard: React.FC<PollutantCardProps> = ({ pollutantKey, value }) => {
  const info = POLLUTANTS_INFO[pollutantKey] || {
    name: pollutantKey.toUpperCase(),
    symbol: pollutantKey.toUpperCase(),
    unit: 'µg/m³',
    whoLimit: 25,
    description: '',
    source: '',
  };

  const ratio = value / info.whoLimit;
  const percentage = Math.min(Math.round((value / (info.whoLimit * 2)) * 100), 100);

  // Determinar severidad
  let statusColor = 'bg-emerald-500';
  let badgeText = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let statusLabel = 'Seguro (OMS)';

  if (ratio > 2) {
    statusColor = 'bg-rose-600';
    badgeText = 'text-rose-700 bg-rose-50 border-rose-200';
    statusLabel = `${ratio.toFixed(1)}x Límite OMS`;
  } else if (ratio > 1) {
    statusColor = 'bg-amber-500';
    badgeText = 'text-amber-700 bg-amber-50 border-amber-200';
    statusLabel = 'Supera guía OMS';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-xs font-bold text-[#1F4E79] uppercase tracking-wider">
            {info.symbol}
          </span>
          <h3 className="text-xs text-slate-500 font-medium line-clamp-1">{info.name}</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeText}`}>
          {statusLabel}
        </span>
      </div>

      <div className="my-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</span>
        <span className="text-xs text-slate-500 font-medium">{info.unit}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Nivel actual</span>
          <span>Guía OMS: {info.whoLimit} {info.unit}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={info.whoLimit * 2}
          />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
        <Info size={13} className="text-[#1F4E79] shrink-0 mt-0.5" />
        <p className="line-clamp-2">{info.source}</p>
      </div>
    </div>
  );
};
