import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { getZones } from '../services/api';
import type { Profile as ProfileType, Zone } from '../types';
import {
  User,
  HeartPulse,
  Bell,
  Clock,
  MapPin,
  Check,
  Shield,
  Activity,
  AlertCircle,
  Smartphone,
  RotateCcw,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, updateProfile, resetOnboarding } = useUserProfile();
  const [zones, setZones] = useState<Zone[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Form local state
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(profile.profile);
  const [hasAsthma, setHasAsthma] = useState<boolean>(profile.hasAsthma);
  const [favoriteZones, setFavoriteZones] = useState<string[]>(profile.favoriteZones);
  const [alertTypes, setAlertTypes] = useState<'all' | 'severe_only'>(profile.alertTypes);
  const [startTime, setStartTime] = useState<string>(profile.notificationHours.start);
  const [endTime, setEndTime] = useState<string>(profile.notificationHours.end);

  useEffect(() => {
    getZones()
      .then((data) => setZones(data.zones))
      .catch(console.error);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    setSelectedProfile(profile.profile);
    setHasAsthma(profile.hasAsthma);
    setFavoriteZones(profile.favoriteZones);
    setAlertTypes(profile.alertTypes);
    setStartTime(profile.notificationHours.start);
    setEndTime(profile.notificationHours.end);
  }, [profile]);

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      new Notification('AireVecinal Madrid', {
        body: 'Notificaciones activadas. Te avisaremos cuando el aire empeore en tu estación de referencia.',
        icon: '/vite.svg',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      profile: selectedProfile,
      hasAsthma,
      favoriteZones,
      alertTypes,
      notificationHours: {
        start: startTime,
        end: endTime,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const toggleZone = (zoneId: string) => {
    setFavoriteZones((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  const profileOptions: Array<{
    id: ProfileType;
    title: string;
    description: string;
    icon: typeof Activity;
  }> = [
    {
      id: 'deportista',
      title: 'Deportista / Runner',
      description: 'Entrenamientos al aire libre, running y ciclismo. Umbral sensible en horas punta.',
      icon: Activity,
    },
    {
      id: 'asmatico',
      title: 'Persona con Asma / Alergias',
      description: 'Alta reactividad respiratoria a partículas PM2.5 y NO₂. Alertas preventivas tempranas.',
      icon: HeartPulse,
    },
    {
      id: 'familia',
      title: 'Familia / Niños / Mayores',
      description: 'Atención a colectivos vulnerables en parques infantiles y colegios urbanos.',
      icon: Shield,
    },
    {
      id: 'general',
      title: 'Población General',
      description: 'Vecinos sin condiciones previas que desean mantenerse informados sobre su aire.',
      icon: User,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabecera */}
      <header className="bg-[#1F4E79] text-white p-4 pt-5 pb-5 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">
                Perfil y Preferencias
              </h1>
              <span className="text-[10px] text-sky-200 font-medium">
                Almacenamiento privado local en tu dispositivo
              </span>
            </div>
          </div>

          {/* Botón: Repetir configuración */}
          <button
            onClick={resetOnboarding}
            className="flex items-center gap-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-xl text-white transition-colors border border-white/20"
            title="Repetir asistente de bienvenida y configuración"
          >
            <RotateCcw size={13} />
            <span>Repetir configuración</span>
          </button>
        </div>
      </header>

      {/* Formulario */}
      <main className="p-4 space-y-4 flex-1">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 text-xs flex items-center gap-2 animate-in fade-in">
            <Check size={16} className="text-emerald-600" />
            <span className="font-semibold">
              ¡Preferencias guardadas exclusivamente en tu navegador (localStorage)!
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Perfil de Sensibilidad */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-[#1F4E79]" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Perfil de Sensibilidad a la Contaminación
              </h2>
            </div>

            <div className="space-y-2">
              {profileOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedProfile === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1F4E79] bg-sky-50/60 ring-2 ring-[#1F4E79]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profileType"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedProfile(opt.id)}
                      className="mt-1 text-[#1F4E79] focus:ring-[#1F4E79]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Icon size={14} className={isSelected ? 'text-[#1F4E79]' : 'text-slate-400'} />
                        <span>{opt.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Checkbox Asma */}
            <label className="flex items-center gap-2.5 pt-2 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAsthma}
                onChange={(e) => setHasAsthma(e.target.checked)}
                className="w-4 h-4 rounded text-[#1F4E79] focus:ring-[#1F4E79]"
              />
              <span className="text-xs text-slate-700 font-medium">
                Padezco asma u otra sensibilidad respiratoria diagnosticada
              </span>
            </label>
          </div>

          {/* Estaciones Favoritas de Madrid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#1F4E79]" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Estaciones Favoritas de Madrid
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">{zones.length} disponibles</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {zones.map((z) => {
                const isChecked = favoriteZones.includes(z.id);
                return (
                  <label
                    key={z.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleZone(z.id)}
                        className="w-4 h-4 rounded text-[#1F4E79] focus:ring-[#1F4E79] shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {z.name} (#{z.code})
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {z.address}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase shrink-0">
                      {z.type?.replace('_', ' ')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Configuración de Notificaciones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#1F4E79]" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Avisos y Notificaciones
              </h2>
            </div>

            {/* Tipo de Alerta */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Filtro de alertas:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertTypes('all')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    alertTypes === 'all'
                      ? 'border-[#1F4E79] bg-sky-50 text-[#1F4E79] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">Todas las alertas</span>
                  <span className="text-[10px] opacity-80">Avisos moderados y graves</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertTypes('severe_only')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    alertTypes === 'severe_only'
                      ? 'border-[#1F4E79] bg-sky-50 text-[#1F4E79] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block font-bold">Solo graves</span>
                  <span className="text-[10px] opacity-80">Únicamente cuando AQI &gt; 100</span>
                </button>
              </div>
            </div>

            {/* Horario de Notificaciones */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock size={14} className="text-slate-500" />
                <span>Horario permitido de avisos:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Desde</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hasta</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Notificaciones Web de Sistema */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-slate-500" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">
                    Notificaciones en el navegador
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Estado:{' '}
                    {notificationPermission === 'granted'
                      ? 'Permitidas'
                      : notificationPermission === 'denied'
                      ? 'Bloqueadas'
                      : 'No solicitadas'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                {notificationPermission === 'granted' ? 'Probar' : 'Activar'}
              </button>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className="w-full bg-[#1F4E79] hover:bg-[#163a5c] text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            <span>Guardar Preferencias</span>
          </button>
        </form>

        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-slate-400" />
          <p>
            Privacidad garantizada: tus datos de sensibilidad y ubicación se guardan exclusivamente
            en tu dispositivo (localStorage) y nunca se envían a ningún servidor externo.
          </p>
        </div>
      </main>
    </div>
  );
};
