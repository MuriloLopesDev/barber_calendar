import React, { useState, useMemo } from 'react';
import { useBarber } from '../../context/BarberContext';
import {
  formatCurrency,
  formatDateISO,
  formatDateFullBR,
  calculateAvailableSlots,
  calculateEndTime,
  getDayOfWeekNumber,
  getTimePeriod,
} from '../../utils/timeUtils';
import { Service, TimeSlotOption } from '../../types';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

export const ClientBookingFlow: React.FC = () => {
  const {
    barber,
    services,
    schedule,
    appointments,
    bookAppointment,
    setActiveRole,
    setActiveBarberTab,
  } = useBarber();

  // Active services only!
  const activeServices = useMemo(
    () => services.filter((s) => s.active),
    [services]
  );

  // Flow step: 'service' | 'date_time' | 'customer' | 'confirm' | 'success'
  const [selectedService, setSelectedService] = useState<Service | null>(
    () => activeServices[0] || null
  );

  // Selected Date string (defaults to today or tomorrow if closed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return formatDateISO(today);
  });

  // Selected time slot
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotOption | null>(null);

  // Customer form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // UI state
  const [bookingStep, setBookingStep] = useState<'service' | 'datetime' | 'customer' | 'success'>('service');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

  // Generate the next 14 calendar days for client date picker
  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const shortDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = formatDateISO(d);
      const dow = d.getDay();
      const sched = schedule.find((s) => s.dayOfWeek === dow);
      const isClosed = !sched || !sched.enabled;

      days.push({
        date: d,
        iso,
        dayNum: d.getDate(),
        dow,
        shortDay: shortDays[dow],
        isClosed,
      });
    }
    return days;
  }, [schedule]);

  // Selected day's schedule
  const selectedDow = useMemo(
    () => getDayOfWeekNumber(selectedDateStr),
    [selectedDateStr]
  );

  const selectedDaySchedule = useMemo(
    () => schedule.find((s) => s.dayOfWeek === selectedDow),
    [schedule, selectedDow]
  );

  // CALCULATE AVAILABLE SLOTS AUTOMATICALLY
  // Strictly respecting selected service duration, existing appointments, work shift
  const availableSlots = useMemo(() => {
    if (!selectedService || !selectedDaySchedule || !selectedDaySchedule.enabled) {
      return [];
    }

    return calculateAvailableSlots(
      selectedDateStr,
      selectedService.durationMinutes,
      selectedDaySchedule,
      appointments
    );
  }, [selectedService, selectedDaySchedule, selectedDateStr, appointments]);

  // Group available slots by period (Manhã, Tarde, Noite)
  const groupedSlots = useMemo(() => {
    const morning = availableSlots.filter((s) => getTimePeriod(s.time) === 'Manhã');
    const afternoon = availableSlots.filter((s) => getTimePeriod(s.time) === 'Tarde');
    const evening = availableSlots.filter((s) => getTimePeriod(s.time) === 'Noite');
    return { morning, afternoon, evening };
  }, [availableSlots]);

  // Handler: select service and proceed to date/time selection
  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setSelectedSlot(null);
    setBookingStep('datetime');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: select time slot
  const handleSelectSlot = (slot: TimeSlotOption) => {
    setSelectedSlot(slot);
    setBookingError(null);
  };

  // Handler: proceed to customer details
  const handleProceedToCustomer = () => {
    if (!selectedSlot || !selectedService) return;
    setBookingStep('customer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: confirm booking with rigorous validation
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!customerName.trim()) {
      setBookingError('Por favor, informe seu nome completo.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      setBookingError('Por favor, informe um WhatsApp ou telefone válido.');
      return;
    }

    if (!selectedService || !selectedSlot) {
      setBookingError('Serviço ou horário não selecionado.');
      return;
    }

    const result = bookAppointment({
      serviceId: selectedService.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date: selectedDateStr,
      startTime: selectedSlot.time,
      notes: bookingNotes.trim(),
    });

    if (!result.success) {
      setBookingError(result.error || 'Não foi possível agendar este horário.');
      return;
    }

    setConfirmedAppointment(result.appointment);
    setBookingStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhoneChange = (val: string) => {
    // Simple BR phone auto-mask (XX) XXXXX-XXXX
    let digits = val.replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length <= 2) {
      setCustomerPhone(digits);
    } else if (digits.length <= 6) {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else if (digits.length <= 10) {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`);
    } else {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      {/* 1. BARBER PROFILE HEADER - Bento Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-[0.02] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-5">
          {/* Avatar with gold border */}
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl p-[2px] bg-[#D4AF37] shadow-xl shadow-[#D4AF37]/10">
              <img
                src={barber.avatar}
                alt={barber.name}
                className="h-full w-full rounded-[14px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#141414] border border-[#333] text-[#D4AF37]">
              <Scissors className="h-3 w-3" />
            </div>
          </div>

          {/* Barber Bio & Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                BARBER MASTER
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#1A1A1A] border border-[#333] px-2.5 py-0.5 text-[11px] font-bold text-[#D4AF37]">
                <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                {barber.rating} ({barber.reviewsCount} avaliações)
              </span>
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-[#EDEDED] sm:text-3xl">
              {barber.name}
            </h1>

            <p className="text-xs font-semibold text-[#888]">
              {barber.specialty}
            </p>

            <p className="text-xs leading-relaxed text-[#666]">
              {barber.bio}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1 text-[11px] text-[#666]">
              <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{barber.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: SERVICES CATALOG */}
      {bookingStep === 'service' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-[#EDEDED]">
                Escolha seu serviço
              </h2>
              <p className="text-xs text-[#666]">
                Selecione o procedimento para visualizar horários em tempo real
              </p>
            </div>
            <span className="rounded-lg border border-[#333] bg-[#1A1A1A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Passo 1 de 3
            </span>
          </div>

          <div className="space-y-3">
            {activeServices.map((service) => {
              return (
                <div
                  key={service.id}
                  className="relative overflow-hidden rounded-xl border border-[#222] bg-[#141414] p-5 shadow-lg transition-all hover:border-[#333]"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#333] text-[#D4AF37]">
                        <Scissors className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#EDEDED]">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="mt-1 text-xs text-[#888] line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="flex items-center gap-1 rounded-md bg-[#1A1A1A] border border-[#333] px-2.5 py-0.5 text-xs font-semibold text-[#888]">
                            <Clock className="h-3 w-3 text-[#D4AF37]" />
                            {service.durationMinutes} minutos
                          </span>
                          <span className="text-sm font-bold text-[#EDEDED]">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`book-service-${service.id}`}
                      onClick={() => handleSelectService(service)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:brightness-110 active:scale-95"
                    >
                      <span>Agendar</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME SELECTION */}
      {bookingStep === 'datetime' && selectedService && (
        <div className="space-y-6">
          {/* Back button & Selected Service Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222] pb-3">
            <button
              onClick={() => setBookingStep('service')}
              className="flex items-center gap-1 text-xs font-semibold text-[#888] hover:text-[#EDEDED]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trocar serviço</span>
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-1.5 text-xs">
              <span className="font-bold text-[#EDEDED]">{selectedService.name}</span>
              <span className="text-[#D4AF37]">({selectedService.durationMinutes} min)</span>
              <span className="font-bold text-[#EDEDED]">
                {formatCurrency(selectedService.price)}
              </span>
            </div>
          </div>

          {/* DATE PICKER ("Quando você quer cortar?") */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold uppercase tracking-tight text-[#EDEDED]">
                Quando você quer cortar?
              </h2>
              <p className="text-xs text-[#666]">
                Selecione o dia desejado para calcular os horários livres para este serviço
              </p>
            </div>

            {/* Horizontal Scrollable Days Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {upcomingDays.map((day) => {
                const isSelected = day.iso === selectedDateStr;

                return (
                  <button
                    key={day.iso}
                    id={`client-day-${day.iso}`}
                    disabled={day.isClosed}
                    onClick={() => {
                      setSelectedDateStr(day.iso);
                      setSelectedSlot(null);
                    }}
                    className={`flex min-w-[70px] flex-col items-center rounded-xl p-3 text-center transition-all active:scale-95 ${
                      isSelected
                        ? 'border-2 border-[#D4AF37] bg-[#1A1A1A] shadow-lg shadow-[#D4AF37]/10 scale-105 z-10'
                        : day.isClosed
                        ? 'cursor-not-allowed border border-[#1a1a1a] bg-[#101010] opacity-40'
                        : 'border border-[#222] bg-[#141414] hover:border-[#333]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-[#D4AF37] font-black' : 'text-[#666]'
                      }`}
                    >
                      {day.shortDay}
                    </span>
                    <span
                      className={`mt-1 text-lg font-black ${
                        isSelected ? 'text-[#EDEDED]' : 'text-[#888]'
                      }`}
                    >
                      {String(day.dayNum).padStart(2, '0')}
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase text-[#555]">
                      {day.isClosed ? 'Off' : 'Livre'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME SLOTS PICKER */}
          <div className="space-y-4 rounded-2xl border border-[#222] bg-[#141414] p-5 shadow-xl">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
                  Horários disponíveis • {formatDateFullBR(selectedDateStr)}
                </h3>
                <p className="text-xs text-[#666]">
                  {selectedDaySchedule?.enabled
                    ? `Expediente: ${selectedDaySchedule.startTime} às ${selectedDaySchedule.endTime} • Janela necessária: ${selectedService.durationMinutes} min`
                    : 'Barbearia fechada neste dia'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#22c55e]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold">{availableSlots.length} horários livres</span>
              </div>
            </div>

            {availableSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#333] bg-[#1A1A1A]/30 p-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-[#444]" />
                <h4 className="mt-2 text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
                  Nenhum horário disponível para esta data
                </h4>
                <p className="mt-1 text-xs text-[#666]">
                  Todos os horários que comportam {selectedService.durationMinutes} minutos já foram reservados para este dia ou a barbearia está fechada. Por favor, escolha outro dia!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Morning */}
                {groupedSlots.morning.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                      Manhã (08:00 às 12:00)
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {groupedSlots.morning.map((slot) => {
                        const isSelected = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            id={`slot-${slot.time.replace(':', '-')}`}
                            onClick={() => handleSelectSlot(slot)}
                            className={`flex flex-col items-center rounded-xl p-2.5 transition-all active:scale-95 ${
                              isSelected
                                ? 'border border-[#D4AF37] bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/30'
                                : 'border border-[#333] bg-[#1A1A1A] text-[#EDEDED] hover:border-[#D4AF37]'
                            }`}
                          >
                            <span className="text-sm font-black">{slot.time}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-black/80 font-bold' : 'text-[#666]'
                              }`}
                            >
                              até {slot.endTime}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {groupedSlots.afternoon.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                      Tarde (12:00 às 18:00)
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {groupedSlots.afternoon.map((slot) => {
                        const isSelected = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            id={`slot-${slot.time.replace(':', '-')}`}
                            onClick={() => handleSelectSlot(slot)}
                            className={`flex flex-col items-center rounded-xl p-2.5 transition-all active:scale-95 ${
                              isSelected
                                ? 'border border-[#D4AF37] bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/30'
                                : 'border border-[#333] bg-[#1A1A1A] text-[#EDEDED] hover:border-[#D4AF37]'
                            }`}
                          >
                            <span className="text-sm font-black">{slot.time}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-black/80 font-bold' : 'text-[#666]'
                              }`}
                            >
                              até {slot.endTime}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening */}
                {groupedSlots.evening.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                      Noite (após as 18:00)
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {groupedSlots.evening.map((slot) => {
                        const isSelected = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            id={`slot-${slot.time.replace(':', '-')}`}
                            onClick={() => handleSelectSlot(slot)}
                            className={`flex flex-col items-center rounded-xl p-2.5 transition-all active:scale-95 ${
                              isSelected
                                ? 'border border-[#D4AF37] bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/30'
                                : 'border border-[#333] bg-[#1A1A1A] text-[#EDEDED] hover:border-[#D4AF37]'
                            }`}
                          >
                            <span className="text-sm font-black">{slot.time}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-black/80 font-bold' : 'text-[#666]'
                              }`}
                            >
                              até {slot.endTime}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Navigation for Step 2 */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-[#222] bg-[#141414]/95 p-4 backdrop-blur-md shadow-2xl">
            <div>
              {selectedSlot ? (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#666]">Horário selecionado:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#D4AF37]">
                      {selectedSlot.time} às {selectedSlot.endTime}
                    </span>
                    <span className="text-xs text-[#888]">
                      ({formatCurrency(selectedService.price)})
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#666]">
                  Escolha um dos horários livres acima para avançar
                </span>
              )}
            </div>

            <button
              id="proceed-to-customer-btn"
              disabled={!selectedSlot}
              onClick={handleProceedToCustomer}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                selectedSlot
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 active:scale-95'
                  : 'cursor-not-allowed bg-[#222] text-[#555]'
              }`}
            >
              <span>Avançar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER DATA & CONFIRMATION */}
      {bookingStep === 'customer' && selectedService && selectedSlot && (
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          <button
            type="button"
            onClick={() => setBookingStep('datetime')}
            className="flex items-center gap-1 text-xs font-semibold text-[#888] hover:text-[#EDEDED]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar para horários</span>
          </button>

          {/* Summary Card - Bento */}
          <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Confirmar Agendamento
              </span>
              <span className="rounded bg-[#22c55e]/20 px-2 py-0.5 text-xs font-bold text-[#4ade80]">
                Disponibilidade Garantida
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Serviço</span>
                <span className="text-sm font-bold text-[#EDEDED]">
                  {selectedService.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Barbeiro</span>
                <span className="text-sm font-semibold text-[#888]">
                  {barber.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Data</span>
                <span className="text-sm font-bold text-[#D4AF37]">
                  {formatDateFullBR(selectedDateStr)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Horário</span>
                <span className="text-sm font-black text-[#EDEDED]">
                  {selectedSlot.time} às {selectedSlot.endTime}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Duração</span>
                <span className="text-sm font-medium text-[#888]">
                  {selectedService.durationMinutes} minutos
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#222] pt-3">
                <span className="text-sm font-bold uppercase tracking-wider text-[#EDEDED]">Valor a pagar</span>
                <span className="text-xl font-black text-[#EDEDED]">
                  {formatCurrency(selectedService.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Inputs */}
          <div className="rounded-2xl border border-[#222] bg-[#141414] p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#EDEDED]">
              Seus Dados para Contato
            </h3>

            {bookingError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                Seu Nome Completo *
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#555]" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-[#333] bg-[#1A1A1A] pl-10 pr-3.5 py-2.5 text-sm text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                WhatsApp / Telefone *
              </label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#555]" />
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full rounded-xl border border-[#333] bg-[#1A1A1A] pl-10 pr-3.5 py-2.5 text-sm text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                Observações ou Detalhes do Corte (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Prefiro navalhado na zero, barba bem alinhada..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2 text-xs text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="submit-booking-btn"
                className="w-full rounded-xl bg-[#D4AF37] py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:brightness-110 active:scale-[0.99]"
              >
                Confirmar Agendamento ({formatCurrency(selectedService.price)})
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS RECEIPT */}
      {bookingStep === 'success' && confirmedAppointment && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#141414] p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#4ade80] shadow-lg shadow-[#22c55e]/10">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="mt-4 text-2xl font-bold uppercase tracking-tight text-[#EDEDED]">
              Horário reservado!
            </h2>
            <p className="mt-1 text-xs text-[#666]">
              Seu corte foi marcado com sucesso e o período foi bloqueado na agenda do barbeiro.
            </p>

            {/* Ticket Card */}
            <div className="mt-6 rounded-xl border border-[#222] bg-[#1A1A1A] p-5 text-left space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
                <span className="text-xs text-[#666]">Cliente</span>
                <span className="text-sm font-bold text-[#EDEDED]">
                  {confirmedAppointment.customerName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Serviço</span>
                <span className="text-sm font-bold text-[#D4AF37]">
                  {confirmedAppointment.serviceName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Data</span>
                <span className="text-sm font-semibold text-[#EDEDED]">
                  {formatDateFullBR(confirmedAppointment.date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Horário Reservado</span>
                <span className="text-sm font-bold text-[#4ade80]">
                  {confirmedAppointment.startTime} às {confirmedAppointment.endTime}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#222] pt-2.5">
                <span className="text-xs text-[#666]">Valor</span>
                <span className="text-base font-black text-[#EDEDED]">
                  {formatCurrency(confirmedAppointment.servicePrice)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={`https://wa.me/55${barber.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(barber.name)},%20acabei%20de%20agendar%20${encodeURIComponent(confirmedAppointment.serviceName)}%20para%20${confirmedAppointment.startTime}%20no%20dia%20${confirmedAppointment.date}.%20Meu%20nome%20%C3%A9%20${encodeURIComponent(confirmedAppointment.customerName)}.`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 py-3 text-xs font-bold text-[#4ade80] hover:bg-[#22c55e]/20"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Avisar no WhatsApp</span>
              </a>

              <button
                id="view-in-barber-agenda-btn"
                onClick={() => {
                  setActiveRole('barber');
                  setActiveBarberTab('agenda');
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-md shadow-[#D4AF37]/20"
              >
                <Calendar className="h-4 w-4" />
                <span>Ver na Agenda do Barbeiro</span>
              </button>
            </div>

            <button
              onClick={() => {
                setBookingStep('service');
                setSelectedSlot(null);
                setCustomerName('');
                setCustomerPhone('');
                setBookingNotes('');
              }}
              className="mt-4 text-xs text-[#666] hover:text-[#EDEDED] hover:underline"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
