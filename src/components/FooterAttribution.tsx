import React from 'react';
import { Database } from 'lucide-react';

export const FooterAttribution: React.FC = () => {
  return (
    <footer className="mt-auto px-4 py-3 text-center border-t border-slate-100 bg-white/60">
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
        <Database size={11} className="text-[#1F4E79]" />
        <span>Fuentes oficiales:</span>
        <a
          href="https://datos.madrid.es"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1F4E79] font-semibold hover:underline"
        >
          Ayuntamiento de Madrid – datos abiertos (CC BY 4.0)
        </a>
        <span>y</span>
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1F4E79] font-semibold hover:underline"
        >
          Open-Meteo
        </a>
      </div>
    </footer>
  );
};
