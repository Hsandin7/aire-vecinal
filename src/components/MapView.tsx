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
  heightClass?: string;
  interactive?: boolean;
}

// Subcomponente para recentrar el mapa cuando cambia la zona seleccionada
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
  heightClass = 'h-64',
  interactive = true,
}) => {
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const centerCoords: [number, number] = selectedZone ? selectedZone.coordinates : [40.4530, -3.6883];

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

        {/* Marcadores de zonas */}
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          // Asignar color según nivel: la zona seleccionada usa el nivel actual; las demás según su tipo
          let zoneLevel: Level = 'bueno';
          if (isSelected) {
            zoneLevel = currentLevel;
          } else if (zone.type === 'avenida') {
            zoneLevel = 'malo';
          } else if (zone.type === 'residencial') {
            zoneLevel = 'moderado';
          }

          const meta = getLevelMetadata(zoneLevel);

          return (
            <CircleMarker
              key={zone.id}
              center={zone.coordinates}
              radius={isSelected ? 14 : 9}
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
                  <div className="text-[11px] text-slate-500">
                    Tipo: {zone.type} • Calidad: <span style={{ color: meta.colorHex }}>{meta.label}</span>
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-slate-900">{zone.name}</p>
                  <p className="text-slate-600">Tráfico: {zone.trafficLevel}</p>
                  {onSelectZone && !isSelected && (
                    <button
                      onClick={() => onSelectZone(zone.id)}
                      className="mt-2 text-xs bg-[#1F4E79] text-white px-2 py-1 rounded w-full"
                    >
                      Seleccionar esta zona
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Trazado de ruta alternativa si existe */}
        {alternativeRoute && alternativeRoute.path && alternativeRoute.path.length > 0 && (
          <>
            {/* Sombra de la ruta */}
            <Polyline
              positions={alternativeRoute.path}
              pathOptions={{
                color: '#047857',
                weight: 6,
                opacity: 0.35,
              }}
            />
            {/* Trazo verde esmeralda de la ruta limpia */}
            <Polyline
              positions={alternativeRoute.path}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                dashArray: '8, 6',
                opacity: 0.9,
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

            {/* Marcador de inicio de la ruta alternativa */}
            <CircleMarker
              center={alternativeRoute.path[0]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#10b981',
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="bottom" offset={[0, 8]}>
                <span className="text-[10px] font-bold text-emerald-800 bg-white/90 px-1 rounded">
                  Inicio Ruta Verde
                </span>
              </Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      {/* Leyenda flotante accesible */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 text-[10px] space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block" />
          <span className="text-slate-700">Bueno (&lt;50)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block" />
          <span className="text-slate-700">Moderado (50-100)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
          <span className="text-slate-700">Malo (&gt;100)</span>
        </div>
        {alternativeRoute && (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-100 text-emerald-700 font-semibold">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block border-b border-dashed border-emerald-700" />
            <span>Ruta alternativa saludable</span>
          </div>
        )}
      </div>
    </div>
  );
};
