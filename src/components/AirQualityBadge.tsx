import React from 'react';
import type { Level } from '../types';
import { getLevelMetadata } from '../utils/airQuality';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';

interface AirQualityBadgeProps {
  level: Level;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AirQualityBadge: React.FC<AirQualityBadgeProps> = ({
  level,
  showIcon = true,
  size = 'md',
}) => {
  const meta = getLevelMetadata(level);

  const getIcon = () => {
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    switch (level) {
      case 'bueno':
        return <CheckCircle2 size={iconSize} className="text-emerald-700" aria-hidden="true" />;
      case 'moderado':
        return <AlertTriangle size={iconSize} className="text-amber-700" aria-hidden="true" />;
      case 'malo':
        return <AlertOctagon size={iconSize} className="text-rose-700" aria-hidden="true" />;
      case 'muy_malo':
        return <ShieldAlert size={iconSize} className="text-purple-700" aria-hidden="true" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${meta.badgeBg} ${meta.badgeText} ${sizeClasses}`}
      role="status"
      aria-label={`Calidad del aire: ${meta.label}`}
    >
      {showIcon && getIcon()}
      <span>{meta.label}</span>
    </span>
  );
};
