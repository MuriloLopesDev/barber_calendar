import React, { useState, useMemo } from 'react';
import { useBarber } from '../../context/BarberContext';
import {
  getWeekDates,
  formatWeekHeader,
  formatDateISO,
  formatCurrency,
  formatDateFullBR,
  calculateAvailableSlots,
  timeToMinutes,
  minutesToTime,
} from '../../utils/timeUtils';
import { Appointment, AppointmentStatus } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  CheckCircle,
  XCircle,
  Plus,
  AlertCircle,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';

export const BarberAgenda: React.FC = () => {
  const {
    appointments,
    services,
    schedule,
    updateAppointmentStatus,
    deleteAppointment,
    bookAppointment,
    setActiveRole,
  } = useBarber();

  // Reference date for weekly calendar (starts at today)
  const [currentWeekReference, setCurrentWeekReference] = useState<Date>(() => new Date());

  // Selected date string (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    formatDateISO(new Date())
  );

  // Quick manual appointment modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [modalError, setModalError] = useState<string | null>(null);

  // Calculate the 7 days of the current week
  const weekDays = useMemo(
    () => getWeekDates(currentWeekReference),
    [currentWeekReference]
  );

  const weekHeaderTitle = useMemo(
    () => formatWeekHeader(weekDays),
    [weekDays]
  );

  // Shift current week by offset (weeks)
  const handleShiftWeek = (offset: number) => {
    const nextDate = new Date(currentWeekReference);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    setCurrentWeekReference(nextDate);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentWeekReference(today);
    setSelectedDateStr(formatDateISO(today));
  };

  // Find schedule info for selected day
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  const selectedDow = selectedDateObj.getDay();
  const daySchedule = schedule.find((s) => s.dayOfWeek === selectedDow);

  // Appointments for the selected day
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDateStr]);

  // Active (non-cancelled) appointments
  const activeAppointments = dayAppointments.filter((a) => a.status !== 'cancelled');

  // Metrics for selected day
  const projectedRevenue = activeAppointments.reduce(
    (sum, a) => sum + (a.servicePrice || 0),
    0
  );

  // Free slots calculation
  const minDuration = services.filter((s) => s.active).length > 0
    ? Math.min(...services.filter((s) => s.active).map((s) => s.durationMinutes))
    : 30;

  const freeSlots = useMemo(() => {
    return calculateAvailableSlots(
      selectedDateStr,
      minDuration,
      daySchedule,
      appointments
    );
  }, [selectedDateStr, minDuration, daySchedule, appointments]);

  // Build a visual interleaved timeline of occupied slots and free gaps
  const timelineItems = useMemo(() => {
    if (!daySchedule || !daySchedule.enabled) return [];

    const workStartMins = timeToMinutes(daySchedule.startTime);
    const workEndMins = timeToMinutes(daySchedule.endTime);

    // Sort active appointments chronologically
    const sorted = [...activeAppointments].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const items: Array<
      | { type: 'appointment'; data: Appointment }
      | { type: 'free'; startTime: string; endTime: string; durationMinutes: number }
    > = [];

    let cursorMins = workStartMins;

    for (const apt of sorted) {
      const aptStartMins = timeToMinutes(apt.startTime);
      const aptEndMins = timeToMinutes(apt.endTime);

      // If there is a free gap before this appointment
      if (aptStartMins > cursorMins) {
        items.push({
          type: 'free',
          startTime: minutesToTime(cursorMins),
          endTime: minutesToTime(aptStartMins),
          durationMinutes: aptStartMins - cursorMins,
        });
      }

      items.push({ type: 'appointment', data: apt });
      cursorMins = Math.max(cursorMins, aptEndMins);
    }

    // Gap at end of day
    if (cursorMins < workEndMins) {
      items.push({
        type: 'free',
        startTime: minutesToTime(cursorMins),
        endTime: minutesToTime(workEndMins),
        durationMinutes: workEndMins - cursorMins,
      });
    }

    return items;
  }, [daySchedule, activeAppointments]);

  const handleCreateQuickAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newCustName.trim()) {
      setModalError('Informe o nome do cliente.');
      return;
    }

    const res = bookAppointment({
      serviceId: newServiceId,
      customerName: newCustName,
      customerPhone: newCustPhone || '(11) 99999-0000',
      date: selectedDateStr,
      startTime: newStartTime,
    });

    if (!res.success) {
      setModalError(res.error || 'Erro ao agendar horário.');
      return;
    }

    setShowAddModal(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const isToday = selectedDateStr === formatDateISO(new Date());

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header: Navigation between Weeks */}
      <div className="relative overflow-hidden rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-[0.02] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#EDEDED] sm:text-2xl">
              Agenda Semanal
            </h1>
            <p className="text-xs uppercase tracking-wider text-[#666]">
              {weekHeaderTitle} • Bento Schedule Control
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpToToday}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                isToday
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                  : 'border-[#333] bg-[#1A1A1A] text-[#888] hover:border-[#D4AF37] hover:text-[#EDEDED]'
              }`}
            >
              Hoje
            </button>

            <div className="flex items-center rounded-xl border border-[#333] bg-[#1A1A1A] p-1">
              <button
                id="prev-week-btn"
                onClick={() => handleShiftWeek(-1)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#888] transition-colors hover:text-[#EDEDED] hover:bg-[#222]"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <span className="px-3 text-xs font-bold text-[#D4AF37]">
                {weekHeaderTitle}
              </span>

              <button
                id="next-week-btn"
                onClick={() => handleShiftWeek(1)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#888] transition-colors hover:text-[#EDEDED] hover:bg-[#222]"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Day Selector Buttons: SEG 05, TER 06, etc. */}
        <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;
            const isCurrentDay = day.dateStr === formatDateISO(new Date());
            const daySched = schedule.find((s) => s.dayOfWeek === day.dayOfWeek);
            const isClosed = !daySched || !daySched.enabled;

            // Count appointments for this day
            const aptCount = appointments.filter(
              (a) => a.date === day.dateStr && a.status !== 'cancelled'
            ).length;

            return (
              <button
                key={day.dateStr}
                id={`day-btn-${day.dateStr}`}
                onClick={() => setSelectedDateStr(day.dateStr)}
                disabled={false}
                className={`relative flex flex-col items-center rounded-xl p-2.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-2 border-[#D4AF37] bg-[#1A1A1A] shadow-lg shadow-[#D4AF37]/10 scale-105 z-10'
                    : 'border border-[#222] bg-[#141414] hover:border-[#333] hover:bg-[#181818]'
                } ${isClosed ? 'opacity-40' : ''}`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-[#D4AF37] font-black' : 'text-[#666]'
                  }`}
                >
                  {day.shortName}
                </span>

                <span
                  className={`mt-1 text-base font-extrabold sm:text-lg ${
                    isSelected
                      ? 'text-[#EDEDED] font-black'
                      : isCurrentDay
                      ? 'text-[#D4AF37]'
                      : 'text-[#888]'
                  }`}
                >
                  {String(day.dayNum).padStart(2, '0')}
                </span>

                {/* Badge / Indicators */}
                <div className="mt-1 flex items-center gap-1">
                  {isClosed ? (
                    <span className="text-[9px] uppercase font-bold text-[#555]">Off</span>
                  ) : aptCount > 0 ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-black text-black">
                      {aptCount}
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#333]" />
                  )}
                </div>

                {isCurrentDay && !isSelected && (
                  <span className="absolute -top-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Summary Metrics */}
      <div className="rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-3 border-b border-[#222] pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#EDEDED]">
              {formatDateFullBR(selectedDateStr)}
            </h2>
            <p className="text-xs text-[#666]">
              {daySchedule?.enabled
                ? `Expediente: ${daySchedule.startTime} às ${daySchedule.endTime}`
                : 'Barbearia fechada neste dia'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {daySchedule?.enabled && (
              <button
                id="open-quick-add-apt-btn"
                onClick={() => {
                  setModalError(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:brightness-110 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Agendamento</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Bento Metric Cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] border border-[#222] p-3.5 rounded-xl text-center shadow-md">
            <p className="text-[10px] uppercase tracking-widest text-[#666] font-bold mb-1">Agendamentos</p>
            <div className="text-2xl font-black text-[#EDEDED] sm:text-3xl">
              {String(activeAppointments.length).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#222] p-3.5 rounded-xl text-center shadow-md">
            <p className="text-[10px] uppercase tracking-widest text-[#666] font-bold mb-1">Slots Livres</p>
            <div className="text-2xl font-black text-[#EDEDED] sm:text-3xl">
              {daySchedule?.enabled ? String(freeSlots.length).padStart(2, '0') : '00'}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#222] p-3.5 rounded-xl text-center shadow-md">
            <p className="text-[10px] uppercase tracking-widest text-[#666] font-bold mb-1">Previsão Lucro</p>
            <div className="text-xl font-black text-[#D4AF37] sm:text-2xl">
              {formatCurrency(projectedRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline / Schedule of the Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
            Grade de Horários & Atendimentos
          </p>
          <span className="text-[10px] uppercase tracking-wider text-[#666]">
            {dayAppointments.length} agendamento(s)
          </span>
        </div>

        {!daySchedule?.enabled ? (
          <div className="rounded-2xl border border-dashed border-[#222] bg-[#141414]/50 p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-[#444]" />
            <h4 className="mt-2 text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
              Dia sem expediente
            </h4>
            <p className="mt-1 text-xs text-[#666]">
              O barbeiro não atende aos {selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}s.
            </p>
          </div>
        ) : timelineItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#222] bg-[#141414]/50 p-10 text-center">
            <Calendar className="mx-auto h-9 w-9 text-[#444]" />
            <h4 className="mt-3 text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
              Nenhum cliente agendado para este dia
            </h4>
            <p className="mt-1 text-xs text-[#666]">
              Aproveite o horário livre ou compartilhe sua agenda com seus clientes!
            </p>
            <button
              onClick={() => setActiveRole('client')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
            >
              Simular Agendamento de Cliente
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {timelineItems.map((item, idx) => {
              if (item.type === 'free') {
                return (
                  <div
                    key={`free-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-dashed border-[#333] bg-[#1A1A1A]/40 px-4 py-3 text-xs transition-all hover:border-[#444]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-center">
                        <p className="text-xs font-bold text-[#888]">{item.startTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#888]">
                          Horário Livre ({item.durationMinutes} min)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setNewStartTime(item.startTime);
                        setShowAddModal(true);
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider border border-[#444] hover:border-[#D4AF37] hover:text-[#D4AF37] px-3 py-1 rounded-full text-[#EDEDED] transition-colors"
                    >
                      Encaixar
                    </button>
                  </div>
                );
              }

              const apt = item.data;
              const isCompleted = apt.status === 'completed';

              return (
                <div
                  key={apt.id}
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 transition-all sm:flex-row sm:items-center ${
                    isCompleted
                      ? 'border-[#222] border-l-4 border-l-[#444] bg-[#141414] opacity-50'
                      : 'border-[#222] border-l-4 border-l-[#D4AF37] bg-[#1A1A1A] shadow-lg'
                  }`}
                >
                  {/* Time & Client Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-xs font-black text-[#EDEDED]">{apt.startTime}</p>
                      <p className="text-[9px] text-[#666]">{apt.durationMinutes} min</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#EDEDED]">
                          {apt.customerName}
                        </h4>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-[#22c55e]/20 text-[#4ade80]'
                              : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                          }`}
                        >
                          {isCompleted ? 'Concluído' : 'Agendado'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#888] pt-0.5">
                        <span className="text-[#D4AF37] font-medium text-[11px]">{apt.serviceName}</span>
                        <span>•</span>
                        <span className="font-bold text-[#EDEDED]">{formatCurrency(apt.servicePrice)}</span>
                        {apt.customerPhone && (
                          <>
                            <span>•</span>
                            <span className="text-[#666]">{apt.customerPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {apt.customerPhone && (
                      <a
                        href={`https://wa.me/55${apt.customerPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(apt.customerName)},%20sou%20o%20barbeiro%20Lucas!%20Confirmando%20seu%20hor%C3%A1rio%20de%20${apt.serviceName}%20às%20${apt.startTime}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-semibold text-[#4ade80] hover:bg-[#22c55e]/20"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    {!isCompleted ? (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        className="flex items-center gap-1 rounded-xl border border-[#333] bg-[#141414] px-3 py-1.5 text-xs font-semibold text-[#888] hover:border-[#22c55e] hover:text-[#22c55e]"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-[#22c55e]" />
                        <span>Concluir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'scheduled')}
                        className="rounded-xl border border-[#333] bg-[#141414] px-2.5 py-1.5 text-xs text-[#666] hover:text-[#EDEDED]"
                      >
                        Reabrir
                      </button>
                    )}

                    <button
                      onClick={() => deleteAppointment(apt.id)}
                      className="rounded-xl border border-[#3b1d1d] bg-[#241414] p-1.5 text-[#f87171] hover:bg-[#3d1a1a]"
                      title="Remover da grade"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#EDEDED]">
                Novo Agendamento Rápido
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#666] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickAppointment} className="mt-4 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  WhatsApp / Telefone
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  Serviço *
                </label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                >
                  {services
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} min) - {formatCurrency(s.price)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Data
                  </label>
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2 text-xs text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Horário Inicial
                  </label>
                  <input
                    type="time"
                    step="300"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2 text-xs text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-[#888] hover:text-[#EDEDED]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#D4AF37] px-5 py-2 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-md shadow-[#D4AF37]/20"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
