import { Injectable, inject, signal, computed, effect, Injector, runInInjectionContext } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore, collection, collectionData, query, where,
  doc, setDoc, updateDoc, deleteDoc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { DoctorService } from './doctor.service';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private docSvc = inject(DoctorService);
  private col = collection(this.firestore, 'appointments');

  private appointments = signal<Appointment[]>([]);
  private currentUid: string | null = null;
  private reassigning = false;
  private reassignedOnce = false;

  constructor() {
    authState(this.auth)
      .pipe(
        switchMap((user) => {
          this.currentUid = user?.uid ?? null;
          if (!user) return of<Appointment[]>([]);
          return runInInjectionContext(this.injector, () => {
            const q = query(this.col, where('ownerId', '==', user.uid));
            return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
          });
        }),
        takeUntilDestroyed()
      )
      .subscribe((list) => this.appointments.set(list));

    // One-time self-heal: reassign appointments whose doctor no longer exists to
    // the first available doctor. Runs ONCE per session, only after both doctors
    // and appointments have loaded, so it never interferes with normal edits.
    effect(() => {
      const appts = this.appointments();
      const docs = this.docSvc.getAll()();
      if (!this.currentUid || this.reassignedOnce || this.reassigning) return;
      if (docs.length === 0 || appts.length === 0) return;
      const validIds = new Set(docs.map((d) => d.id));
      const orphans = appts.filter((a) => !validIds.has(a.doctorId));
      if (orphans.length === 0) { this.reassignedOnce = true; return; }
      this.reassigning = true;
      const target = docs[0].id;
      runInInjectionContext(this.injector, () =>
        Promise.all(
          orphans.map((o) =>
            updateDoc(doc(this.firestore, 'appointments', o.id), { doctorId: target })
          )
        )
      ).finally(() => { this.reassigning = false; this.reassignedOnce = true; });
    });
  }

  getAll() { return this.appointments(); }

  getByDate(date: string) {
    return computed(() => this.appointments().filter((a) => a.date === date));
  }

  getDatesWithAppointments() {
    return computed(() => new Set(this.appointments().map((a) => a.date)));
  }

  // Idempotent create: the document ID is generated once, then written with
  // setDoc. Even if the underlying write fires twice, it targets the same
  // document, so duplicates are impossible.
  async add(appt: Omit<Appointment, 'id' | 'createdAt'>) {
    if (!this.currentUid) return;
    const uid = this.currentUid;
    const ref = runInInjectionContext(this.injector, () => doc(this.col));
    await runInInjectionContext(this.injector, () =>
      setDoc(ref, { ...appt, ownerId: uid, createdAt: new Date().toISOString() })
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

  // Creates sample appointments spread across the provided doctor IDs, across
  // today + the next two days. Uses idempotent setDoc writes.
  async seedSampleData(doctorIds: string[]) {
    if (!this.currentUid || doctorIds.length === 0) return;
    const today = new Date();
    const dateStr = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    };
    const pick = (i: number) => doctorIds[i % doctorIds.length];

    const samples: Omit<Appointment, 'id' | 'createdAt'>[] = [
      { patientName: 'Jon Smith',     phone: '+1 555 123 4567', date: dateStr(0), hour: 9,  minute: 0,  doctorId: pick(0), type: 'checkup',     duration: 30, status: 'scheduled', notes: 'Routine annual check-up. History of hypertension.' },
      { patientName: 'Jane Doe',      phone: '+1 555 987 6543', date: dateStr(0), hour: 10, minute: 30, doctorId: pick(1), type: 'preventive',  duration: 45, status: 'confirmed', notes: 'Cleaning and fluoride treatment.' },
      { patientName: 'Marko Ilic',    phone: '+381 63 555 777', date: dateStr(0), hour: 13, minute: 0,  doctorId: pick(0), type: 'diagnostic',  duration: 60, status: 'scheduled', notes: 'ECG and blood pressure monitoring.' },
      { patientName: 'Ana Petrovic',  phone: '+381 64 222 333', date: dateStr(1), hour: 9,  minute: 30, doctorId: pick(2), type: 'restorative', duration: 90, status: 'scheduled', notes: 'Composite filling, upper left molar.' },
      { patientName: 'Tom Jones',     phone: '+1 555 000 911',  date: dateStr(1), hour: 14, minute: 0,  doctorId: pick(1), type: 'emergency',   duration: 30, status: 'confirmed', notes: 'Follow-up after urgent visit.' },
      { patientName: 'Maria Novak',   phone: '+381 65 444 555', date: dateStr(2), hour: 11, minute: 0,  doctorId: pick(0), type: 'checkup',     duration: 30, status: 'scheduled', notes: 'First visit.' },
      { patientName: 'Petar Djordic', phone: '+381 63 888 999', date: dateStr(2), hour: 15, minute: 30, doctorId: pick(2), type: 'preventive',  duration: 15, status: 'scheduled', notes: 'Vaccination follow-up.' },
    ];

    const uid = this.currentUid;
    await runInInjectionContext(this.injector, () =>
      Promise.all(
        samples.map((s) => {
          const ref = doc(this.col);
          return setDoc(ref, { ...s, ownerId: uid, createdAt: new Date().toISOString() });
        })
      )
    );
  }
}