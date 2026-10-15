import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { ForecastHour } from '../types';
import { getLevelMetadata } from '../utils/airQuality';
import { Clock } from 'lucide-react';

interface HourlyChartProps {
  data: ForecastHour[];
}

export const HourlyChart: React.FC<HourlyChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
        No hay datos de previsión disponibles.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#1F4E79]" />
          <h3 className="text-sm font-bold text-slate-800">Previsión a 6 horas</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">Índice AQI previsto</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax * 1.15))]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={50} stroke="#16a34a" strokeDasharray="3 3" opacity={0.6} />
            <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="3 3" opacity={0.6} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ForecastHour;
                  const meta = getLevelMetadata(item.level);
                  return (
                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs space-y-1.5 max-w-[200px]">
                      <div className="flex items-center justify-between font-bold border-b border-slate-100 pb-1">
                        <span className="text-slate-800">{item.hour}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{ backgroundColor: `${meta.colorHex}20`, color: meta.colorHex }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="font-extrabold text-base" style={{ color: meta.colorHex }}>
                        AQI {item.aqi}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        NO₂: {item.no2} µg/m³ • PM2.5: {item.pm25} µg/m³
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight pt-1 border-t border-slate-100">
                        {item.explanation}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="aqi" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => {
                const meta = getLevelMetadata(entry.level);
                return <Cell key={`cell-${index}`} fill={meta.colorHex} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span>&lt;50 Bueno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#d97706]" />
          <span>50-100 Moderado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
          <span>&gt;100 Malo</span>
        </div>
      </div>
    </div>
  );
};
