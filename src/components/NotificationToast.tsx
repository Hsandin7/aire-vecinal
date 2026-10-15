import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationToastProps {
  message: string;
  title?: string;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  title = 'Aviso de Calidad del Aire',
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div className="w-full max-w-[400px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700 pointer-events-auto flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <Bell size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-100 font-medium leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              navigate('/alerts');
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Ver ruta protegida</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
