import { Injectable, signal } from '@angular/core';
import { Doctor, DOCTOR_COLORS } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private doctors = signal<Doctor[]>([
    { id: 'doc1', name: 'Dr. Marković',  specialty: 'General',    color: DOCTOR_COLORS[0].bg, textColor: DOCTOR_COLORS[0].text },
    { id: 'doc2', name: 'Dr. Jovanović', specialty: 'Dentist',    color: DOCTOR_COLORS[1].bg, textColor: DOCTOR_COLORS[1].text },
    { id: 'doc3', name: 'Dr. Nikolić',   specialty: 'Cardiology', color: DOCTOR_COLORS[2].bg, textColor: DOCTOR_COLORS[2].text },
  ]);

  getAll() { return this.doctors; }

  add(name: string, specialty: string) {
    const idx = this.doctors().length % DOCTOR_COLORS.length;
    const color = DOCTOR_COLORS[idx];
    this.doctors.update(list => [...list, {
      id: 'doc_' + Date.now(),
      name, specialty,
      color: color.bg,
      textColor: color.text,
    }]);
  }

  remove(id: string) {
    this.doctors.update(list => list.filter(d => d.id !== id));
  }

  getById(id: string) {
    return this.doctors().find(d => d.id === id);
  }

  initials(name: string) {
    return name.replace('Dr.', '').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}