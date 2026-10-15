import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Popup,
  useMap,
} from 'react-leaflet';
import type { Zone, Level, RouteAlternative } from '../types';
import { getLevelMetadata } from '../utils/airQuality';

interface MapViewProps {
  zones: Zone[];
  selectedZoneId: string;
  onSelectZone?: (zoneId: string) => void;
  currentLevel?: Level;
  alternativeRoute?: RouteAlternative;
  allRoutes?: RouteAlternative[];
  heightClass?: string;
  interactive?: boolean;
}

const RecenterView: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 14, { animate: true });
  }, [coords, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  currentLevel = 'moderado',
  alternativeRoute,
  allRoutes = [],
  heightClass = 'h-64',
  interactive = true,
}) => {
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[1] || zones[0];
  const centerCoords: [number, number] = selectedZone
    ? selectedZone.coordinates
    : [40.4215533, -3.6823158]; // Escuelas Aguirre por defecto

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative`}>
      <MapContainer
        center={centerCoords}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <RecenterView coords={centerCoords} />

        {/* 4 Rutas Fijas (Rutas de Madrid) */}
        {allRoutes.map((r) => {
          const isSelectedRoute = alternativeRoute?.id === r.id;
          if (isSelectedRoute) return null; // se renderiza abajo con estilo destacado
          return (
            <Polyline
              key={r.id}
              positions={r.path}
              pathOptions={{
                color: '#059669',
                weight: 3,
                dashArray: '4, 4',
                opacity: 0.5,
              }}
            >
              <Tooltip direction="top">
                <span className="text-[11px] font-bold">{r.name}</span>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Marcadores de estaciones de la Red de Madrid */}
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          let zoneLevel: Level = 'bueno';
          if (isSelected) {
            zoneLevel = currentLevel;
          } else if (zone.type === 'urbana_trafico') {
            zoneLevel = 'moderado';
          } else if (zone.type === 'suburbana') {
            zoneLevel = 'bueno';
          }

          const meta = getLevelMetadata(zoneLevel);

          return (
            <CircleMarker
              key={zone.id}
              center={zone.coordinates}
              radius={isSelected ? 13 : 8}
              pathOptions={{
                color: isSelected ? '#1F4E79' : '#ffffff',
                weight: isSelected ? 3 : 1.5,
                fillColor: meta.colorHex,
                fillOpacity: isSelected ? 0.95 : 0.75,
              }}
              eventHandlers={{
                click: () => {
                  if (interactive && onSelectZone) {
                    onSelectZone(zone.id);
                  }
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs font-sans font-medium">
                  <div className="font-bold text-slate-800">{zone.name}</div>
                  <div className="text-[10px] text-slate-500">
                    Estación #{zone.code} • {zone.type?.replace('_', ' ')}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs p-1 space-y-1">
                  <p className="font-bold text-slate-900">{zone.name}</p>
                  <p className="text-[11px] text-slate-500">{zone.address}</p>
                  {onSelectZone && !isSelected && (
                    <button
                      onClick={() => onSelectZone(zone.id)}
                      className="mt-1 text-xs bg-[#1F4E79] text-white px-2 py-1 rounded w-full font-bold"
                    >
                      Ver estación
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Trazado de ruta alternativa recomendada */}
        {alternativeRoute && alternativeRoute.path && alternativeRoute.path.length > 0 && (
          <>
            <Polyline
              positions={alternativeRoute.path}
              pathOptions={{
                color: '#047857',
                weight: 6,
                opacity: 0.35,
              }}
            />
            <Polyline
              positions={alternativeRoute.path}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                dashArray: '8, 6',
                opacity: 0.95,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-emerald-800">{alternativeRoute.name}</p>
                  <p className="text-slate-600">{alternativeRoute.description}</p>
                  <p className="text-emerald-700 font-semibold">
                    Índice: {alternativeRoute.expectedLevel.toUpperCase()} (AQI {alternativeRoute.expectedAqi})
                  </p>
                </div>
              </Popup>
            </Polyline>

            {/* Marcador de inicio de la ruta recomendada */}
            <CircleMarker
              center={alternativeRoute.path[0]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#10b981',
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="bottom" offset={[0, 8]}>
                <span className="text-[10px] font-bold text-emerald-800 bg-white/90 px-1.5 py-0.5 rounded shadow-xs">
                  Ruta Verde: {alternativeRoute.name}
                </span>
              </Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      {/* Leyenda accesible */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 text-[10px] space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block" />
          <span className="text-slate-700">Bueno</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block" />
          <span className="text-slate-700">Moderado</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
          <span className="text-slate-700">Malo</span>
        </div>
        {alternativeRoute && (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-100 text-emerald-700 font-semibold">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block border-b border-dashed border-emerald-700" />
            <span>Ruta verde recomendada</span>
          </div>
        )}
      </div>
    </div>
  );
};
