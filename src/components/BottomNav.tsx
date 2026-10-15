import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Bell, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/detail', label: 'Detalle', icon: BarChart2 },
    { to: '/alerts', label: 'Alertas', icon: Bell },
    { to: '/profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-white border-t border-slate-200">
      <div className="w-full max-w-[430px] flex items-center justify-around py-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-medium py-1 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-[#1F4E79] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
