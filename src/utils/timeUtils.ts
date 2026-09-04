import { Appointment, DayOfWeekNumber, TimeSlotOption, WorkScheduleDay } from '../types';

/**
 * Converts "HH:mm" to total minutes from midnight (0 - 1439)
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts total minutes from midnight to "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Automatically calculates end time based on start time and service duration in minutes
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;
  return minutesToTime(endMins);
}

/**
 * Strict conflict check mandated by the system rules:
 * Conflito se: novoInicio < agendamentoExistenteFim E novoFim > agendamentoExistenteInicio
 */
export function hasConflict(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string
): boolean {
  const nStart = timeToMinutes(newStart);
  const nEnd = timeToMinutes(newEnd);
  const eStart = timeToMinutes(existingStart);
  const eEnd = timeToMinutes(existingEnd);

  return nStart < eEnd && nEnd > eStart;
}

/**
 * Formats a number to Brazilian Real (R$) currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parses "YYYY-MM-DD" safely into a local Date object
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats Date to "YYYY-MM-DD"
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats Date to friendly PT-BR string: "Sábado, 10 de Outubro"
 */
export function formatDateFullBR(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
  
  // Capitalize first letter of weekday and month
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capWeekday}, ${day} de ${capMonth}`;
}

/**
 * Gets day of week number (0 = Domingo, 1 = Segunda, ... 6 = Sábado)
 */
export function getDayOfWeekNumber(dateStr: string): DayOfWeekNumber {
  const date = parseLocalDate(dateStr);
  return date.getDay() as DayOfWeekNumber;
}

/**
 * Core Algorithm: Calculates available time slots for a given date and service duration.
 * Considers:
 * 1. Working schedule for that day (opening and closing hours).
 * 2. Service duration (slot must entirely fit before work schedule ends).
 * 3. Existing non-cancelled appointments.
 * 4. Generates standard 10-minute cadence candidate slots + appointment end times.
 */
export function calculateAvailableSlots(
  dateStr: string,
  serviceDurationMinutes: number,
  scheduleDay: WorkScheduleDay | undefined,
  existingAppointments: Appointment[],
  candidateStepMinutes: number = 10
): TimeSlotOption[] {
  // If schedule is missing or day is marked as disabled (closed)
  if (!scheduleDay || !scheduleDay.enabled) {
    return [];
  }

  const workStartMins = timeToMinutes(scheduleDay.startTime);
  const workEndMins = timeToMinutes(scheduleDay.endTime);

  // Filter appointments for this date and not cancelled
  const activeAppointments = existingAppointments.filter(
    (apt) => apt.date === dateStr && apt.status !== 'cancelled'
  );

  // Build candidate start times
  const candidateMinutesSet = new Set<number>();

  // Regular intervals (10 minutes)
  for (let m = workStartMins; m < workEndMins; m += candidateStepMinutes) {
    candidateMinutesSet.add(m);
  }

  // Also include exact end times of existing appointments as candidate starts
  // (e.g. if an appointment ended at 08:35 or 10:10, a new service can start immediately at that exact minute)
  for (const apt of activeAppointments) {
    const endMins = timeToMinutes(apt.endTime);
    if (endMins >= workStartMins && endMins < workEndMins) {
      candidateMinutesSet.add(endMins);
    }
  }

  const sortedCandidates = Array.from(candidateMinutesSet).sort((a, b) => a - b);
  const slots: TimeSlotOption[] = [];

  for (const startMins of sortedCandidates) {
    const endMins = startMins + serviceDurationMinutes;
    const startTimeStr = minutesToTime(startMins);
    const endTimeStr = minutesToTime(endMins);

    // Rule 1: Service cannot exceed the end of the shift
    if (endMins > workEndMins) {
      continue;
    }

    // Rule 2: Service cannot start before opening
    if (startMins < workStartMins) {
      continue;
    }

    // Rule 3: Check conflict with any active appointment
    let isConflicting = false;
    let conflictReason = '';

    for (const apt of activeAppointments) {
      if (hasConflict(startTimeStr, endTimeStr, apt.startTime, apt.endTime)) {
        isConflicting = true;
        conflictReason = `Conflito com atendimento das ${apt.startTime} às ${apt.endTime}`;
        break;
      }
    }

    // Only return slots that are completely free!
    if (!isConflicting) {
      slots.push({
        time: startTimeStr,
        endTime: endTimeStr,
        available: true,
      });
    }
  }

  return slots;
}

/**
 * Returns the 7 days (Monday to Sunday) for a week given any reference date
 */
export function getWeekDates(referenceDate: Date): { date: Date; dateStr: string; dayName: string; shortName: string; dayNum: number; dayOfWeek: DayOfWeekNumber }[] {
  const current = new Date(referenceDate);
  const day = current.getDay(); // 0 = Sunday
  // Normalize to Monday as first day (Segunda = 1, Domingo = 7)
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const week = [];
  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const shortNames = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    const dow = nextDate.getDay() as DayOfWeekNumber;
    
    week.push({
      date: nextDate,
      dateStr: formatDateISO(nextDate),
      dayName: dayNames[i],
      shortName: shortNames[i],
      dayNum: nextDate.getDate(),
      dayOfWeek: dow,
    });
  }

  return week;
}

/**
 * Formats week range text, e.g. "05 - 11 Outubro 2026"
 */
export function formatWeekHeader(weekDays: { date: Date }[]): string {
  if (weekDays.length === 0) return '';
  const first = weekDays[0].date;
  const last = weekDays[weekDays.length - 1].date;

  const firstDay = String(first.getDate()).padStart(2, '0');
  const lastDay = String(last.getDate()).padStart(2, '0');
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(last);
  const year = last.getFullYear();
  const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return `${firstDay} - ${lastDay} de ${capMonth}`;
}

/**
 * Categorizes a time string into "Manhã", "Tarde", "Noite"
 */
export function getTimePeriod(timeStr: string): 'Manhã' | 'Tarde' | 'Noite' {
  const mins = timeToMinutes(timeStr);
  if (mins < 12 * 60) return 'Manhã';
  if (mins < 18 * 60) return 'Tarde';
  return 'Noite';
}
