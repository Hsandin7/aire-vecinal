import type { Level } from '../types';

export interface LevelMetadata {
  label: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  bgSoft: string;
  borderClass: string;
  ringClass: string;
  description: string;
}

export const LEVEL_MAP: Record<Level, LevelMetadata> = {
  bueno: {
    label: 'Bueno',
    colorHex: '#16a34a',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    bgSoft: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    ringClass: 'ring-emerald-500',
    description: 'Calidad del aire óptima. Sin riesgo para la salud.',
  },
  moderado: {
    label: 'Moderado',
    colorHex: '#d97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    bgSoft: 'bg-amber-50',
    borderClass: 'border-amber-300',
    ringClass: 'ring-amber-500',
    description: 'Aceptable para la mayoría. Precaución para personas sensibles.',
  },
  malo: {
    label: 'Malo',
    colorHex: '#dc2626',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    bgSoft: 'bg-rose-50',
    borderClass: 'border-rose-300',
    ringClass: 'ring-rose-500',
    description: 'Perjudicial para la salud. Grupos sensibles deben evitar el aire libre.',
  },
  muy_malo: {
    label: 'Muy malo',
    colorHex: '#7c3aed',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    bgSoft: 'bg-purple-50',
    borderClass: 'border-purple-300',
    ringClass: 'ring-purple-500',
    description: 'Alerta sanitaria. Evitar toda actividad física en el exterior.',
  },
};

export interface PollutantDetail {
  key: 'pm25' | 'pm10' | 'no2' | 'o3';
  name: string;
  symbol: string;
  unit: string;
  whoLimit: number; // Límite OMS 24h
  description: string;
  source: string;
}

export const POLLUTANTS_INFO: Record<string, PollutantDetail> = {
  pm25: {
    key: 'pm25',
    name: 'Partículas Finas',
    symbol: 'PM2.5',
    unit: 'µg/m³',
    whoLimit: 15,
    description: 'Partículas microscópicas menores a 2.5 µm capaces de penetrar profundamente en el árbol bronquial y torrente sanguíneo.',
    source: 'Emisiones de motores diésel, frenado y calderas urbanas.',
  },
  no2: {
    key: 'no2',
    name: 'Dióxido de Nitrógeno',
    symbol: 'NO₂',
    unit: 'µg/m³',
    whoLimit: 25,
    description: 'Gas tóxico reactivo producido en la combustión de vehículos. Irrita las vías respiratorias y agrava crisis de asma.',
    source: 'Tráfico rodado, en especial vehículos diésel y tráfico lento de avenidas.',
  },
  pm10: {
    key: 'pm10',
    name: 'Partículas Respirables',
    symbol: 'PM10',
    unit: 'µg/m³',
    whoLimit: 45,
    description: 'Partículas de polvo, polen y residuos de neumáticos en suspensión.',
    source: 'Rodadura de neumáticos en asfalto, abrasión mecánica y obras urbanas.',
  },
  o3: {
    key: 'o3',
    name: 'Ozono Troposférico',
    symbol: 'O₃',
    unit: 'µg/m³',
    whoLimit: 100,
    description: 'Contaminante secundario formado por reacciones fotoquímicas con radiación solar intensa.',
    source: 'Reacción de hidrocarburos y NOx bajo radiación solar y calor.',
  },
};

export function getLevelMetadata(level: Level): LevelMetadata {
  return LEVEL_MAP[level] || LEVEL_MAP.moderado;
}
