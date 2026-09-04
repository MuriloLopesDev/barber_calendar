export type DayOfWeekNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, ...

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  bio: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  address: string;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface WorkScheduleDay {
  id: string;
  barberId: string;
  dayOfWeek: DayOfWeekNumber;
  dayName: string;
  shortName: string;
  enabled: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "09:00"
  endTime: string;    // "09:30" (calculated automatically)
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export type ViewRole = 'barber' | 'client';

export type BarberTab = 'dashboard' | 'agenda' | 'services' | 'schedule' | 'settings';

export type ClientStep = 'service' | 'date' | 'time' | 'customer' | 'confirmation' | 'success';

export interface TimeSlotOption {
  time: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}
