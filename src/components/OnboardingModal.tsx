import React, { useState } from 'react';
import type { Profile } from '../types';
import estacionesData from '../data/estaciones.json';
import {
  Wind,
  Activity,
  HeartPulse,
  Shield,
  User,
  MapPin,
  Compass,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (profile: { profile: Profile; hasAsthma: boolean; favoriteZones: string[] }) => void;
  onSkip: () => void;
}

// Cálculo de distancia euclídea/Haversine localmente en el navegador (coordenadas nunca salen del cliente)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Estados locales del onboarding
  const [selectedProfile, setSelectedProfile] = useState<Profile>('deportista');
  const [hasAsthma, setHasAsthma] = useState<boolean>(true);
  const [selectedStationId, setSelectedStationId] = useState<string>('28079008'); // Escuelas Aguirre
  const [geoLocating, setGeoLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  interface StationItem {
    id: string;
    code: string;
    name: string;
    address: string;
    type: string;
    coordinates: [number, number];
  }
  const stations = estacionesData as unknown as StationItem[];

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Tu navegador no soporta geolocalización.');
      return;
    }

    setGeoLocating(true);
    setLocationStatus('Localizando de forma privada en tu dispositivo...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Buscar estación más cercana en Madrid de forma 100% local
        let closest = stations[0];
        let minDistance = calculateDistanceKm(
          userLat,
          userLng,
          closest.coordinates[0],
          closest.coordinates[1]
        );

        for (const s of stations) {
          const d = calculateDistanceKm(userLat, userLng, s.coordinates[0], s.coordinates[1]);
          if (d < minDistance) {
            minDistance = d;
            closest = s;
          }
        }

        setSelectedStationId(closest.id);
        setLocationStatus(`Estación más cercana: ${closest.name} (a ${(minDistance * 1000).toFixed(0)} m)`);
      },
      (error) => {
        setGeoLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('Permiso de ubicación denegado. Selecciona tu estación de la lista.');
        } else {
          setLocationStatus('No se pudo obtener la ubicación. Elige tu estación manualmente.');
        }
      },
      { timeout: 8000 }
    );
  };

  const handleFinish = () => {
    onComplete({
      profile: selectedProfile,
      hasAsthma,
      favoriteZones: [selectedStationId],
    });
  };

  const profileOptions: Array<{
    id: Profile;
    title: string;
    description: string;
    icon: typeof Activity;
  }> = [
    {
      id: 'deportista',
      title: 'Deportista / Runner',
      description: 'Salgo a correr o entrenar al aire libre y quiero avisos si sube el NO₂.',
      icon: Activity,
    },
    {
      id: 'asmatico',
      title: 'Persona con Asma / Alergias',
      description: 'Sensibilidad pulmonar alta ante picos de partículas PM2.5 y NO₂.',
      icon: HeartPulse,
    },
    {
      id: 'familia',
      title: 'Familia con Niños / Mayores',
      description: 'Atención a colectivos vulnerables en paseos y parques infantiles.',
      icon: Shield,
    },
    {
      id: 'general',
      title: 'Población General',
      description: 'Deseo conocer la calidad del aire de mi barrio y rutas recomendadas.',
      icon: User,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Barra superior con paso y botón Saltar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-[#1F4E79]' : s < step ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
            <span className="text-[11px] font-bold text-slate-400 ml-1">Paso {step} de 3</span>
          </div>
          <button
            onClick={onSkip}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md"
          >
            Saltar
          </button>
        </div>

        {/* Contenido según el paso */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* PASO 1: BIENVENIDA */}
          {step === 1 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 bg-sky-50 text-[#1F4E79] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Wind size={36} className="text-[#1F4E79]" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Comunidad y Salud
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">Bienvenido a AireVecinal</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tu monitor de calidad del aire en Madrid en tiempo real. Te avisa cuando el aire
                  empeora y te recomienda rutas verdes protegidas.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <div className="p-1 bg-white rounded-lg text-emerald-600 shadow-2xs shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <strong className="block text-slate-800">24 Estaciones Oficiales de Madrid</strong>
                    <span className="text-[11px] text-slate-500">
                      Datos en tiempo real del Ayuntamiento de Madrid y Open-Meteo.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <div className="p-1 bg-white rounded-lg text-[#1F4E79] shadow-2xs shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <strong className="block text-slate-800">Rutas Verdes Alternativas</strong>
                    <span className="text-[11px] text-slate-500">
                      El Retiro, Madrid Río, Casa de Campo y Parque del Oeste.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <div className="p-1 bg-white rounded-lg text-purple-600 shadow-2xs shrink-0 mt-0.5">
                    <Shield size={14} />
                  </div>
                  <div>
                    <strong className="block text-slate-800">Privacidad 100%</strong>
                    <span className="text-[11px] text-slate-500">
                      Sin registros, sin cuentas. Tus preferencias se guardan solo en tu navegador.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ELEGIR PERFIL */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">¿Cuál es tu perfil?</h2>
                <p className="text-xs text-slate-500">
                  Calibraremos las alertas según tu nivel de actividad y sensibilidad.
                </p>
              </div>

              <div className="space-y-2">
                {profileOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedProfile === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedProfile(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#1F4E79] bg-sky-50/60 ring-2 ring-[#1F4E79]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#1F4E79] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{opt.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {opt.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 pt-2 border-t border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAsthma}
                  onChange={(e) => setHasAsthma(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1F4E79] focus:ring-[#1F4E79]"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Padezco asma u otra sensibilidad respiratoria
                </span>
              </label>
            </div>
          )}

          {/* PASO 3: ELEGIR ESTACIÓN */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Tu estación de referencia</h2>
                <p className="text-xs text-slate-500">
                  Selecciona la estación de control de calidad del aire más cercana en Madrid.
                </p>
              </div>

              {/* Botón Usar mi ubicación */}
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLocating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Compass size={16} className={geoLocating ? 'animate-spin' : ''} />
                <span>{geoLocating ? 'Calculando estación más cercana...' : 'Usar mi ubicación actual'}</span>
              </button>

              {locationStatus && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-medium">
                  {locationStatus}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  O selecciona de las 24 estaciones oficiales:
                </label>
                <div className="relative">
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-[11px] text-sky-900 flex items-start gap-2">
                <MapPin size={14} className="text-[#1F4E79] shrink-0 mt-0.5" />
                <p>
                  Tu ubicación se calcula de forma 100% privada dentro de tu navegador y nunca se envía
                  a ningún servidor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones inferiores */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="bg-[#1F4E79] hover:bg-[#163a5c] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Siguiente</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Comenzar a explorar</span>
              <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
