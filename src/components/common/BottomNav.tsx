import React from 'react';
import { useBarber } from '../../context/BarberContext';
import { BarberTab } from '../../types';
import { LayoutDashboard, Calendar, Scissors, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeBarberTab, setActiveBarberTab, appointments } = useBarber();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(
    (a) => a.date === todayStr && a.status === 'scheduled'
  ).length;

  const tabs: { id: BarberTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar, badge: todayCount },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'schedule', label: 'Horários', icon: Clock },
    { id: 'settings', label: 'Ajustes', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2A2A2A] bg-[#0F0F0F]/95 backdrop-blur-lg">
      <div className="mx-auto flex h-[60px] max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeBarberTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveBarberTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1.5 transition-transform active:scale-95 ${
                isActive ? 'text-[#D4AF37]' : 'text-[#666] hover:text-[#999]'
              }`}
            >
              <div className="relative">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                    isActive ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-transform ${isActive ? 'scale-110 text-[#D4AF37]' : 'text-[#666]'}`} />
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-black text-black">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-tighter ${isActive ? 'text-[#D4AF37] font-black' : 'text-[#666]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

