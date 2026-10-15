import React from 'react';
import type { Recommendation } from '../types';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertBannerProps {
  recommendation: Recommendation;
  compact?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  recommendation,
  compact = false,
}) => {
  const isHighRisk = recommendation.level === 'malo' || recommendation.level === 'muy_malo';
  const isModerate = recommendation.level === 'moderado';

  if (!isHighRisk && !isModerate) {
    if (compact) return null;
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
        <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-emerald-900">{recommendation.alertTitle}</h4>
          <p className="text-xs text-emerald-700 mt-0.5">{recommendation.alertMessage}</p>
        </div>
      </div>
    );
  }

  const borderClass = isHighRisk ? 'border-rose-300' : 'border-amber-300';
  const bgClass = isHighRisk ? 'bg-rose-50' : 'bg-amber-50';
  const titleColor = isHighRisk ? 'text-rose-900' : 'text-amber-900';
  const textColor = isHighRisk ? 'text-rose-800' : 'text-amber-800';
  const Icon = isHighRisk ? AlertOctagon : AlertTriangle;
  const iconColor = isHighRisk ? 'text-rose-600' : 'text-amber-600';

  return (
    <div className={`${bgClass} border ${borderClass} rounded-2xl p-4 shadow-sm space-y-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-white/80 rounded-lg shadow-2xs">
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Aviso Vecinal
            </span>
            <h4 className={`text-sm font-bold ${titleColor} leading-tight`}>
              {recommendation.alertTitle}
            </h4>
          </div>
        </div>
        {recommendation.timeWindow && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/90 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs whitespace-nowrap">
            <Clock size={12} />
            {recommendation.timeWindow}
          </span>
        )}
      </div>

      <p className={`text-xs font-medium ${textColor} leading-relaxed`}>
        {recommendation.alertMessage}
      </p>

      {compact ? (
        <div className="pt-1 flex justify-end">
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1F4E79] hover:underline"
          >
            <span>Ver ruta alternativa y consejos</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        recommendation.actionItems.length > 0 && (
          <div className="pt-2 border-t border-rose-200/60">
            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Acciones recomendadas:
            </h5>
            <ul className="space-y-1">
              {recommendation.actionItems.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <span className="text-[#1F4E79] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
};
