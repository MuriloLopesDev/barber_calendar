import React from 'react';
import { BarberProvider, useBarber } from './context/BarberContext';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { BarberDashboard } from './components/barber/BarberDashboard';
import { BarberAgenda } from './components/barber/BarberAgenda';
import { ServicesManager } from './components/barber/ServicesManager';
import { ScheduleManager } from './components/barber/ScheduleManager';
import { BarberProfileSettings } from './components/barber/BarberProfileSettings';
import { ClientBookingFlow } from './components/client/ClientBookingFlow';
import { Sparkles, Scissors, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeRole, activeBarberTab, setActiveRole } = useBarber();

  return (
    <div className="relative min-h-screen barber-bg text-[#f1f3f5]">
      {/* Navbar with role switcher */}
      <Navbar />

      {/* Mode helper banner for demonstration */}
      <div className="border-b border-[#222] bg-[#0F0F0F] px-4 py-2 text-center text-xs text-[#888]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
            <span>
              {activeRole === 'barber' ? (
                <>
                  Modo Barbeiro ativo:{' '}
                  <strong className="text-[#D4AF37]">Lucas Martins</strong>. Gerencie serviços, horários e sua agenda no Bento Grid.
                </>
              ) : (
                <>
                  Modo Cliente ativo: Agende seu corte com cálculo automático de horários por duração.
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setActiveRole(activeRole === 'barber' ? 'client' : 'barber')}
            className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] hover:underline"
          >
            {activeRole === 'barber' ? 'Alternar para Cliente →' : 'Alternar para Barbeiro →'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {activeRole === 'barber' ? (
          <div>
            {activeBarberTab === 'dashboard' && <BarberDashboard />}
            {activeBarberTab === 'agenda' && <BarberAgenda />}
            {activeBarberTab === 'services' && <ServicesManager />}
            {activeBarberTab === 'schedule' && <ScheduleManager />}
            {activeBarberTab === 'settings' && <BarberProfileSettings />}

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </div>
        ) : (
          <div>
            <ClientBookingFlow />
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BarberProvider>
      <MainContent />
    </BarberProvider>
  );
}
