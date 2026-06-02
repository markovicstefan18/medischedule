import { Injectable, signal, computed } from '@angular/core';
import { Appointment, AppointmentType } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private appointments = signal<Appointment[]>([
    { id: '1', patientName: 'Jon Smith',    phone: '+1 555 123 4567', date: '2026-05-28', hour: 7,  minute: 0,  doctorId: 'doc1', type: 'checkup',     duration: 30,  status: 'scheduled' as const,  notes: 'Routine annual check-up. Patient has history of hypertension.', createdAt: new Date().toISOString() },
    { id: '2', patientName: 'Jane Doe',     phone: '+1 555 987 6543', date: '2026-05-28', hour: 8,  minute: 0,  doctorId: 'doc1', type: 'preventive',  duration: 45,  status: 'confirmed' as const,  notes: 'Teeth cleaning and fluoride treatment.', createdAt: new Date().toISOString() },
    { id: '3', patientName: 'Marko Ilić',  phone: '+381 63 555 777', date: '2026-05-28', hour: 10, minute: 15, doctorId: 'doc1', type: 'diagnostic',  duration: 60,  status: 'scheduled' as const,  notes: 'ECG and blood pressure monitoring. Follow-up required.', createdAt: new Date().toISOString() },
    { id: '4', patientName: 'Ana Petrović',phone: '+381 64 222 333', date: '2026-05-28', hour: 13, minute: 0,  doctorId: 'doc1', type: 'restorative', duration: 90,  status: 'completed' as const,  notes: 'Composite filling on upper left molar.', createdAt: new Date().toISOString() },
    { id: '5', patientName: 'Tom Jones',    phone: '+1 555 000 911',  date: '2026-05-28', hour: 17, minute: 0,  doctorId: 'doc1', type: 'emergency',   duration: 30,  status: 'noshow' as const,     notes: 'Severe tooth pain. X-ray needed urgently.', createdAt: new Date().toISOString() },
    { id: '6', patientName: 'Maria Novak', phone: '+381 65 444 555', date: '2026-05-29', hour: 9,  minute: 0,  doctorId: 'doc1', type: 'checkup',     duration: 30,  status: 'scheduled' as const,  notes: 'First visit.', createdAt: new Date().toISOString() },
    { id: '7', patientName: 'Petar Đorđić',phone: '+381 63 888 999', date: '2026-05-29', hour: 11, minute: 30, doctorId: 'doc1', type: 'preventive',  duration: 15,  status: 'confirmed' as const,  notes: 'Vaccination follow-up.', createdAt: new Date().toISOString() },
  ]);

  getAll() { return this.appointments(); }

  getByDate(date: string) {
    return computed(() => this.appointments().filter(a => a.date === date));
  }

  getDatesWithAppointments() {
    return computed(() => new Set(this.appointments().map(a => a.date)));
  }

  add(appt: Omit<Appointment, 'id' | 'createdAt'>) {
    this.appointments.update(list => [...list, {
      ...appt, id: Date.now().toString(), createdAt: new Date().toISOString()
    }]);
  }

  update(id: string, changes: Partial<Appointment>) {
    this.appointments.update(list => list.map(a => a.id === id ? { ...a, ...changes } : a));
  }

  remove(id: string) {
    this.appointments.update(list => list.filter(a => a.id !== id));
  }

  removeByDoctor(doctorId: string) {
    this.appointments.update(list => list.filter(a => a.doctorId !== doctorId));
  }

  hasOverlap(appt: Omit<Appointment, 'id' | 'createdAt'>, excludeId?: string): boolean {
    const start = Number(appt.hour) * 60 + Number(appt.minute);
    const end = start + Number(appt.duration || 30);
    return this.appointments().some(a => {
      if (excludeId && a.id === excludeId) return false;
      if (a.date !== appt.date) return false;
      if (a.doctorId !== appt.doctorId) return false;
      const aStart = Number(a.hour) * 60 + Number(a.minute);
      const aEnd = aStart + Number(a.duration || 30);
      return start < aEnd && end > aStart;
    });
  }
}