import React, { useState } from 'react';
import { useBarber } from '../../context/BarberContext';
import { DayOfWeekNumber } from '../../types';
import { timeToMinutes } from '../../utils/timeUtils';
import {
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Calendar,
  Save,
} from 'lucide-react';

export const ScheduleManager: React.FC = () => {
  const { schedule, updateScheduleDay } = useBarber();

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleToggleDay = (dayOfWeek: DayOfWeekNumber, currentEnabled: boolean) => {
    updateScheduleDay(dayOfWeek, { enabled: !currentEnabled });
    triggerSaveFeedback();
  };

  const handleTimeChange = (
    dayOfWeek: DayOfWeekNumber,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    updateScheduleDay(dayOfWeek, { [field]: value });
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Quick preset actions
  const applyStandardWeek = () => {
    // Seg-Qui 08-18, Sex 08-20, Sáb 08-16, Dom Fechado
    updateScheduleDay(1, { enabled: true, startTime: '08:00', endTime: '18:00' });
    updateScheduleDay(2, { enabled: true, startTime: '08:00', endTime: '18:00' });
    updateScheduleDay(3, { enabled: true, startTime: '08:00', endTime: '18:00' });
    updateScheduleDay(4, { enabled: true, startTime: '08:00', endTime: '18:00' });
    updateScheduleDay(5, { enabled: true, startTime: '08:00', endTime: '20:00' });
    updateScheduleDay(6, { enabled: true, startTime: '08:00', endTime: '16:00' });
    updateScheduleDay(0, { enabled: false, startTime: '08:00', endTime: '12:00' });
    triggerSaveFeedback();
  };

  // Order days from Segunda (1) to Domingo (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]
    .map((dow) => schedule.find((s) => s.dayOfWeek === dow))
    .filter(Boolean);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase text-[#EDEDED] sm:text-3xl">
            Horários de Trabalho
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-[#666]">
            Configure seu expediente semanal e regras de bloqueio na grade Bento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#22c55e]">
              <Check className="h-4 w-4" />
              <span>Salvo automaticamente!</span>
            </span>
          )}
          <button
            onClick={applyStandardWeek}
            className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#222] transition-colors"
          >
            Padrão Barbearia
          </button>
        </div>
      </div>

      {/* Notice on Closing Time Rule */}
      <div className="rounded-xl border border-[#222] bg-[#141414] p-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#1A1A1A] border border-[#333] p-2 text-[#D4AF37]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EDEDED]">
              Regra de Fechamento Automático
            </h4>
            <p className="mt-0.5 text-xs leading-relaxed text-[#888]">
              Se você encerra às 18:00 e o cliente seleciona um corte de 30 minutos, o sistema nunca oferecerá horários após as 17:30, garantindo que nenhum atendimento ultrapasse o fim do seu expediente.
            </p>
          </div>
        </div>
      </div>

      {/* Days Configuration Table / Cards */}
      <div className="space-y-3">
        {orderedDays.map((day) => {
          if (!day) return null;

          const startM = timeToMinutes(day.startTime);
          const endM = timeToMinutes(day.endTime);
          const totalHours = ((endM - startM) / 60).toFixed(1);

          return (
            <div
              key={day.dayOfWeek}
              className={`flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center shadow-md ${
                day.enabled
                  ? 'border-[#222] border-l-4 border-l-[#D4AF37] bg-[#141414] hover:border-[#333]'
                  : 'border-[#222] border-l-4 border-l-[#444] bg-[#141414] opacity-50'
              }`}
            >
              {/* Day Name & Toggle */}
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => handleToggleDay(day.dayOfWeek, day.enabled)}
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                    day.enabled ? 'bg-[#D4AF37]' : 'bg-[#333]'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-[#0A0A0A] transition-transform ${
                      day.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#EDEDED]">
                      {day.dayName}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        day.enabled
                          ? 'bg-[#22c55e]/20 text-[#4ade80]'
                          : 'bg-[#444]/20 text-[#888]'
                      }`}
                    >
                      {day.enabled ? 'Aberto' : 'Não trabalha'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#666]">
                    {day.enabled ? `${totalHours}h de expediente programado` : 'Agenda fechada para clientes'}
                  </span>
                </div>
              </div>

              {/* Time Pickers (only enabled if day is open) */}
              {day.enabled ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">De:</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)
                      }
                      className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Até:</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)
                      }
                      className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs italic text-[#555]">
                  Sem horários de atendimento aos clientes
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
