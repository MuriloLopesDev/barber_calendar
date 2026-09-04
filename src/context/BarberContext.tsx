import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Barber,
  Service,
  WorkScheduleDay,
  Appointment,
  AppointmentStatus,
  ViewRole,
  BarberTab,
  DayOfWeekNumber,
} from '../types';
import {
  INITIAL_BARBER,
  INITIAL_SERVICES,
  INITIAL_SCHEDULE,
  generateSeedAppointments,
} from '../data/initialData';
import { calculateEndTime, hasConflict, timeToMinutes } from '../utils/timeUtils';

interface BookAppointmentPayload {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  notes?: string;
}

interface BarberContextType {
  barber: Barber;
  services: Service[];
  schedule: WorkScheduleDay[];
  appointments: Appointment[];
  activeRole: ViewRole;
  setActiveRole: (role: ViewRole) => void;
  activeBarberTab: BarberTab;
  setActiveBarberTab: (tab: BarberTab) => void;
  clientPreselectedServiceId: string | null;
  setClientPreselectedServiceId: (id: string | null) => void;

  // Barber Actions
  addService: (service: Omit<Service, 'id' | 'barberId'>) => Service;
  updateService: (id: string, updates: Partial<Omit<Service, 'id' | 'barberId'>>) => void;
  deleteService: (id: string) => void;
  toggleServiceStatus: (id: string) => void;

  updateScheduleDay: (dayOfWeek: DayOfWeekNumber, updates: Partial<WorkScheduleDay>) => void;
  updateBarberProfile: (updates: Partial<Barber>) => void;

  // Appointment Actions
  bookAppointment: (payload: BookAppointmentPayload) => { success: boolean; appointment?: Appointment; error?: string };
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  resetToDefaults: () => void;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BARBER: 'barber_app_barber_v1',
  SERVICES: 'barber_app_services_v1',
  SCHEDULE: 'barber_app_schedule_v1',
  APPOINTMENTS: 'barber_app_appointments_v1',
};

export const BarberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [barber, setBarber] = useState<Barber>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BARBER);
      return saved ? JSON.parse(saved) : INITIAL_BARBER;
    } catch {
      return INITIAL_BARBER;
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [schedule, setSchedule] = useState<WorkScheduleDay[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    } catch {
      return INITIAL_SCHEDULE;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : generateSeedAppointments();
    } catch {
      return generateSeedAppointments();
    }
  });

  const [activeRole, setActiveRole] = useState<ViewRole>('barber');
  const [activeBarberTab, setActiveBarberTab] = useState<BarberTab>('dashboard');
  const [clientPreselectedServiceId, setClientPreselectedServiceId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BARBER, JSON.stringify(barber));
    } catch (e) {
      console.error('Failed to save barber profile', e);
    }
  }, [barber]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services', e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to save appointments', e);
    }
  }, [appointments]);

  // Service CRUD
  const addService = (data: Omit<Service, 'id' | 'barberId'>): Service => {
    const newService: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      barberId: barber.id,
    };
    setServices((prev) => [...prev, newService]);
    return newService;
  };

  const updateService = (id: string, updates: Partial<Omit<Service, 'id' | 'barberId'>>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleServiceStatus = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // Schedule Updates
  const updateScheduleDay = (dayOfWeek: DayOfWeekNumber, updates: Partial<WorkScheduleDay>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d))
    );
  };

  const updateBarberProfile = (updates: Partial<Barber>) => {
    setBarber((prev) => ({ ...prev, ...updates }));
  };

  // Rigorous Booking Logic with Double-Validation:
  const bookAppointment = (payload: BookAppointmentPayload) => {
    const service = services.find((s) => s.id === payload.serviceId);
    if (!service) {
      return { success: false, error: 'Serviço não encontrado.' };
    }

    if (!service.active) {
      return { success: false, error: 'Este serviço está inativo no momento.' };
    }

    // Determine Day of Week for the date (0 = Sunday, 1 = Monday, ...)
    const [y, m, d] = payload.date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    const dayOfWeek = targetDate.getDay() as DayOfWeekNumber;

    const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.enabled) {
      return { success: false, error: 'O barbeiro não atende neste dia.' };
    }

    // Automatically calculate end time
    const computedEndTime = calculateEndTime(payload.startTime, service.durationMinutes);

    // Validate shift limits:
    const startMins = timeToMinutes(payload.startTime);
    const endMins = timeToMinutes(computedEndTime);
    const shiftStartMins = timeToMinutes(daySchedule.startTime);
    const shiftEndMins = timeToMinutes(daySchedule.endTime);

    if (startMins < shiftStartMins) {
      return {
        success: false,
        error: `Horário antes do início do expediente (${daySchedule.startTime}).`,
      };
    }

    if (endMins > shiftEndMins) {
      return {
        success: false,
        error: `O serviço dura ${service.durationMinutes} min e terminaria às ${computedEndTime}, ultrapassando o fim do expediente (${daySchedule.endTime}).`,
      };
    }

    // Validate conflicts against all existing active appointments on this date:
    // Conflict rule: novoInicio < agendamentoExistenteFim E novoFim > agendamentoExistenteInicio
    const activeOnDate = appointments.filter(
      (a) => a.date === payload.date && a.status !== 'cancelled'
    );

    for (const existing of activeOnDate) {
      if (hasConflict(payload.startTime, computedEndTime, existing.startTime, existing.endTime)) {
        return {
          success: false,
          error: `Conflito de horário com agendamento existente de ${existing.startTime} às ${existing.endTime}.`,
        };
      }
    }

    // All clear! Create appointment:
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      barberId: barber.id,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      durationMinutes: service.durationMinutes,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: computedEndTime,
      status: 'scheduled',
      notes: payload.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
    return { success: true, appointment: newAppointment };
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const resetToDefaults = () => {
    setBarber(INITIAL_BARBER);
    setServices(INITIAL_SERVICES);
    setSchedule(INITIAL_SCHEDULE);
    const seeds = generateSeedAppointments();
    setAppointments(seeds);
    try {
      localStorage.removeItem(STORAGE_KEYS.BARBER);
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
      localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    } catch {}
  };

  return (
    <BarberContext.Provider
      value={{
        barber,
        services,
        schedule,
        appointments,
        activeRole,
        setActiveRole,
        activeBarberTab,
        setActiveBarberTab,
        clientPreselectedServiceId,
        setClientPreselectedServiceId,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
        updateScheduleDay,
        updateBarberProfile,
        bookAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        resetToDefaults,
      }}
    >
      {children}
    </BarberContext.Provider>
  );
};

export function useBarber() {
  const context = useContext(BarberContext);
  if (!context) {
    throw new Error('useBarber must be used within a BarberProvider');
  }
  return context;
}
