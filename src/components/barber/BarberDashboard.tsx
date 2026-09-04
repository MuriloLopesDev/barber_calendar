import React from 'react';
import { useBarber } from '../../context/BarberContext';
import {
  formatCurrency,
  formatDateFullBR,
  formatDateISO,
  calculateAvailableSlots,
  getDayOfWeekNumber,
} from '../../utils/timeUtils';
import {
  Calendar,
  Clock,
  TrendingUp,
  User,
  Phone,
  CheckCircle,
  Scissors,
  ArrowRight,
  Share2,
  CalendarCheck,
  Check,
} from 'lucide-react';

export const BarberDashboard: React.FC = () => {
  const {
    barber,
    appointments,
    services,
    schedule,
    setActiveBarberTab,
    setActiveRole,
    updateAppointmentStatus,
  } = useBarber();

  const [copiedLink, setCopiedLink] = React.useState(false);

  const todayStr = formatDateISO(new Date());
  const todayDow = getDayOfWeekNumber(todayStr);
  const todaySchedule = schedule.find((s) => s.dayOfWeek === todayDow);

  // Appointments for today
  const todayAppointments = appointments
    .filter((a) => a.date === todayStr && a.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Projected revenue today
  const projectedRevenue = todayAppointments.reduce(
    (sum, a) => sum + (a.servicePrice || 0),
    0
  );

  // Free slots today (based on a 30m standard reference or smallest active service)
  const minDuration = services.filter((s) => s.active).length > 0
    ? Math.min(...services.filter((s) => s.active).map((s) => s.durationMinutes))
    : 30;

  const freeSlotsToday = calculateAvailableSlots(
    todayStr,
    minDuration,
    todaySchedule,
    appointments
  );

  // Find next upcoming appointment
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const upcomingAppointments = todayAppointments.filter((a) => {
    const [h, m] = a.startTime.split(':').map(Number);
    const aptMinutes = h * 60 + m;
    return a.status === 'scheduled' && aptMinutes >= currentMinutes - 15;
  });

  const nextAppointment = upcomingAppointments[0] || todayAppointments.find((a) => a.status === 'scheduled');

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase text-[#EDEDED] sm:text-3xl">
            Olá, {barber.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-[#666]">
            {formatDateFullBR(todayStr)} • Bento Control System
          </p>
        </div>

        {/* Quick action: simulate client */}
        <div className="flex items-center gap-2">
          <button
            id="share-link-btn"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-[#888] transition-all hover:border-[#D4AF37] hover:text-[#EDEDED] active:scale-95"
          >
            {copiedLink ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Share2 className="h-4 w-4 text-[#D4AF37]" />}
            <span>{copiedLink ? 'Link copiado!' : 'Copiar Link'}</span>
          </button>

          <button
            id="test-client-booking-btn"
            onClick={() => setActiveRole('client')}
            className="flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:brightness-110 active:scale-95"
          >
            <span>Ver como Cliente</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Card: Next Client */}
      {nextAppointment ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-[0.03] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222] pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                Próximo Atendimento
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#1A1A1A] px-3 py-1 text-xs font-semibold text-[#EDEDED]">
              <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{nextAppointment.startTime} às {nextAppointment.endTime}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#333] text-base font-black text-[#D4AF37] shadow-inner">
                  {nextAppointment.customerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#EDEDED]">
                    {nextAppointment.customerName}
                  </h3>
                  <p className="text-xs text-[#666]">
                    {nextAppointment.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-bold text-[#D4AF37]">
                  <Scissors className="h-3 w-3" />
                  {nextAppointment.serviceName}
                </span>
                <span className="text-xs text-[#666]">
                  • {nextAppointment.durationMinutes} min
                </span>
                <span className="font-bold text-xs text-[#EDEDED]">
                  • {formatCurrency(nextAppointment.servicePrice)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {nextAppointment.customerPhone && (
                <a
                  href={`https://wa.me/55${nextAppointment.customerPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(nextAppointment.customerName)},%20sou%20o%20barbeiro%20Lucas!%20Confirmando%20seu%20hor%C3%A1rio%20hoje%20%C3%A0s%20${nextAppointment.startTime}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-xs font-semibold text-[#4ade80] transition-colors hover:bg-[#22c55e]/20"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                id="complete-next-apt-btn"
                onClick={() => updateAppointmentStatus(nextAppointment.id, 'completed')}
                className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-[#888] hover:text-[#EDEDED] hover:border-[#22c55e]/50"
              >
                <CheckCircle className="h-3.5 w-3.5 text-[#22c55e]" />
                <span>Concluir</span>
              </button>

              <button
                id="view-agenda-from-dashboard-btn"
                onClick={() => setActiveBarberTab('agenda')}
                className="flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 shadow-md shadow-[#D4AF37]/20"
              >
                <span>Ver Agenda</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#222] bg-[#141414] p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#333] text-[#D4AF37]">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
            Nenhum cliente na fila agora
          </h3>
          <p className="mt-1 text-xs text-[#666]">
            Todos os atendimentos anteriores foram concluídos ou você está em intervalo.
          </p>
        </div>
      )}

      {/* Metrics Row (Hoje) - Bento 3 Columns */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
            Hoje • Resumo do Dia
          </p>
          <span className="text-[10px] uppercase tracking-wider text-[#666]">
            Expediente: {todaySchedule?.enabled ? `${todaySchedule.startTime} às ${todaySchedule.endTime}` : 'Fechado'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Agendamentos */}
          <div className="bg-[#141414] border border-[#222] p-4 rounded-xl shadow-lg">
            <p className="text-[10px] text-[#666] uppercase tracking-widest mb-1">Agendamentos Hoje</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#EDEDED]">{String(todayAppointments.length).padStart(2, '0')}</span>
              <span className="text-[#D4AF37] text-xs font-medium">
                +{todayAppointments.filter((a) => a.status === 'scheduled').length} pendentes
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[#666]">
              {todayAppointments.filter((a) => a.status === 'completed').length} concluídos
            </p>
          </div>

          {/* Card 2: Previsto */}
          <div className="bg-[#141414] border border-[#222] p-4 rounded-xl shadow-lg">
            <p className="text-[10px] text-[#666] uppercase tracking-widest mb-1">Previsão Lucro</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#D4AF37]">
                {formatCurrency(projectedRevenue)}
              </span>
              <span className="text-[#666] text-xs">/ dia</span>
            </div>
            <p className="mt-1 text-[10px] text-[#666]">
              Faturamento previsto hoje
            </p>
          </div>

          {/* Card 3: Horários Livres */}
          <div className="bg-[#141414] border border-[#222] p-4 rounded-xl shadow-lg">
            <p className="text-[10px] text-[#666] uppercase tracking-widest mb-1">Slots Livres</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#EDEDED]">
                {String(freeSlotsToday.length).padStart(2, '0')}
              </span>
              <span className="text-[#666] text-xs">vagas</span>
            </div>
            <p className="mt-1 text-[10px] text-[#666]">
              Janelas livres disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Próximos Atendimentos Hoje */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
            Próximos Atendimentos Hoje
          </p>
          <button
            onClick={() => setActiveBarberTab('agenda')}
            className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:underline"
          >
            Ver agenda semanal &rarr;
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#222] bg-[#141414]/50 p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-[#444]" />
            <p className="mt-2 text-sm font-semibold text-[#888]">
              Nenhum cliente agendado para hoje.
            </p>
            <p className="mt-1 text-xs text-[#666]">
              Aproveite o horário livre ou compartilhe seu link de agendamento com clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => {
              const isCompleted = apt.status === 'completed';

              return (
                <div
                  key={apt.id}
                  className={`flex items-center justify-between rounded-xl p-3 border transition-all ${
                    isCompleted
                      ? 'border-[#222] border-l-4 border-l-[#444] bg-[#141414] opacity-50'
                      : 'border-[#222] border-l-4 border-l-[#D4AF37] bg-[#1A1A1A] shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Time Box */}
                    <div className="w-16 text-center">
                      <p className="text-xs font-black text-[#EDEDED]">{apt.startTime}</p>
                      <p className="text-[9px] text-[#666]">{apt.durationMinutes} min</p>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#EDEDED]">
                          {apt.customerName}
                        </h4>
                        {isCompleted && (
                          <span className="rounded bg-[#22c55e]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#4ade80] uppercase">
                            Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#888]">
                        {apt.serviceName}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#EDEDED]">
                        {formatCurrency(apt.servicePrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isCompleted ? (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          title="Marcar como Concluído"
                          className="rounded-lg border border-[#333] bg-[#141414] p-2 text-[#888] hover:border-[#22c55e] hover:text-[#22c55e]"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'scheduled')}
                          title="Reabrir Agendamento"
                          className="text-xs text-[#666] hover:underline"
                        >
                          Desfazer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
