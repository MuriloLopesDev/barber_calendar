import React from 'react';
import { useBarber } from '../../context/BarberContext';
import { Scissors, UserCheck, Calendar, ExternalLink, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeRole, setActiveRole, barber, appointments } = useBarber();

  // Count today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(
    (a) => a.date === todayStr && a.status === 'scheduled'
  ).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2A2A2A] bg-[#0F0F0F]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[70px] max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 rotate-3 items-center justify-center rounded-lg bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-transform hover:rotate-0">
            <span className="text-xl font-black italic text-black">B</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight uppercase text-[#EDEDED]">
                BARBER<span className="text-[#D4AF37]">PRO</span>
              </h1>
              <span className="hidden rounded bg-[#1A1A1A] border border-[#333] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#D4AF37] sm:inline-block">
                BENTO
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#666]">
              {activeRole === 'barber' ? `Painel • ${barber.name}` : `Professional Grooming • ${barber.name}`}
            </p>
          </div>
        </div>

        {/* Role Switcher Pill & Master Barber info */}
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-xs font-medium text-[#EDEDED]">{barber.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]">Master Barber</span>
          </div>

          <div className="flex items-center rounded-xl border border-[#2A2A2A] bg-[#141414] p-1 shadow-inner">
            <button
              id="role-barber-btn"
              onClick={() => setActiveRole('barber')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeRole === 'barber'
                  ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                  : 'text-[#888] hover:text-[#EDEDED]'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Barbeiro</span>
              {todayCount > 0 && activeRole !== 'barber' && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-black text-black">
                  {todayCount}
                </span>
              )}
            </button>

            <button
              id="role-client-btn"
              onClick={() => setActiveRole('client')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeRole === 'client'
                  ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                  : 'text-[#888] hover:text-[#EDEDED]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Cliente</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

