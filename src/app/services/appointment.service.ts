import { Injectable, inject, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore, collection, collectionData, query, where,
  addDoc, updateDoc, deleteDoc, doc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private col = collection(this.firestore, 'appointments');

  private appointments = signal<Appointment[]>([]);
  private currentUid: string | null = null;

  constructor() {
    // Runs in injection context (constructor), so no wrapping needed here.
    authState(this.auth)
      .pipe(
        switchMap((user) => {
          this.currentUid = user?.uid ?? null;
          if (!user) return of<Appointment[]>([]);
          const q = query(this.col, where('ownerId', '==', user.uid));
          return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
        }),
        takeUntilDestroyed()
      )
      .subscribe((list) => this.appointments.set(list));
  }

  getAll() { return this.appointments(); }

  getByDate(date: string) {
    return computed(() => this.appointments().filter((a) => a.date === date));
  }

  getDatesWithAppointments() {
    return computed(() => new Set(this.appointments().map((a) => a.date)));
  }

  // Writes run from event handlers (outside injection context), so we wrap
  // them with runInInjectionContext to keep AngularFire happy in a zoneless app.
  async add(appt: Omit<Appointment, 'id' | 'createdAt'>) {
    if (!this.currentUid) return;
    await runInInjectionContext(this.injector, () =>
      addDoc(this.col, {
        ...appt,
        ownerId: this.currentUid,
        createdAt: new Date().toISOString(),
      })
    );
  }

  async update(id: string, changes: Partial<Appointment>) {
    const { id: _omitId, ...rest } = changes as Partial<Appointment> & { id?: string };
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, 'appointments', id), rest)
    );
  }

  async remove(id: string) {
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, 'appointments', id))
    );
  }

  async removeByDoctor(doctorId: string) {
    const matches = this.appointments().filter((a) => a.doctorId === doctorId);
    await runInInjectionContext(this.injector, () =>
      Promise.all(
        matches.map((a) => deleteDoc(doc(this.firestore, 'appointments', a.id)))
      )
    );
  }

  hasOverlap(appt: Omit<Appointment, 'id' | 'createdAt'>, excludeId?: string): boolean {
    const start = Number(appt.hour) * 60 + Number(appt.minute);
    const end = start + Number(appt.duration || 30);
    return this.appointments().some((a) => {
      if (excludeId && a.id === excludeId) return false;
      if (a.date !== appt.date) return false;
      if (a.doctorId !== appt.doctorId) return false;
      const aStart = Number(a.hour) * 60 + Number(a.minute);
      const aEnd = aStart + Number(a.duration || 30);
      return start < aEnd && end > aStart;
    });
  }
}