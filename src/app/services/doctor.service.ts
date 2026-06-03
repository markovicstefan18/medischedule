import { Injectable, inject, signal, effect, Injector, runInInjectionContext } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore, collection, collectionData, query, where, addDoc, deleteDoc, doc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { Doctor, DOCTOR_COLORS } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private col = collection(this.firestore, 'doctors');

  private doctors = signal<Doctor[]>([]);
  private currentUid: string | null = null;
  private loaded = false;          // have we received at least one snapshot for this user?
  private ensuring = false;        // guard against duplicate auto-create

  // Track the current user so we can name the default doctor after them.
  private user = toSignal(authState(this.auth));

  constructor() {
    authState(this.auth)
      .pipe(
        switchMap((user) => {
          this.currentUid = user?.uid ?? null;
          this.loaded = false;
          if (!user) return of<Doctor[]>([]);
          return runInInjectionContext(this.injector, () => {
            const q = query(this.col, where('ownerId', '==', user.uid));
            return collectionData(q, { idField: 'id' }) as Observable<Doctor[]>;
          });
        }),
        takeUntilDestroyed()
      )
      .subscribe((list) => {
        this.doctors.set(list);
        this.loaded = true;
      });

    // When a signed-in user has loaded zero doctors, create one default doctor
    // so the calendar always has at least one column. Runs once per empty state.
    effect(() => {
      const list = this.doctors();
      const uid = this.currentUid;
      if (uid && this.loaded && list.length === 0 && !this.ensuring) {
        this.ensuring = true;
        const u = this.user();
        const name = u?.displayName || (u?.email ? u.email.split('@')[0] : 'Doctor');
        this.createDoctor(name, 'General').finally(() => { this.ensuring = false; });
      }
    });
  }

  getAll() { return this.doctors; }

  getById(id: string) { return this.doctors().find((d) => d.id === id); }

  initials(name: string) {
    return name.replace('Dr.', '').trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private createDoctor(name: string, specialty: string): Promise<unknown> {
    const idx = this.doctors().length % DOCTOR_COLORS.length;
    const color = DOCTOR_COLORS[idx];
    const uid = this.currentUid;
    return runInInjectionContext(this.injector, () =>
      addDoc(this.col, {
        name,
        specialty,
        color: color.bg,
        textColor: color.text,
        ownerId: uid,
        createdAt: new Date().toISOString(),
      })
    );
  }

  async add(name: string, specialty: string) {
    if (!this.currentUid) return;
    await this.createDoctor(name, specialty);
  }

  // Refuses to remove the last remaining doctor, so the calendar always keeps
  // at least one column. Returns false if the removal was blocked.
  async remove(id: string): Promise<boolean> {
    if (this.doctors().length <= 1) return false;
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, 'doctors', id))
    );
    return true;
  }

  // Used by the "Load sample data" flow. Returns existing doctor ids, or
  // creates a few sample doctors if somehow none exist.
  async ensureSampleDoctors(): Promise<string[]> {
    if (!this.currentUid) return [];
    const existing = this.doctors();
    if (existing.length > 0) return existing.map((d) => d.id);

    const samples = [
      { name: 'Dr. Marković',  specialty: 'General' },
      { name: 'Dr. Jovanović', specialty: 'Dentist' },
      { name: 'Dr. Nikolić',   specialty: 'Cardiology' },
    ];
    const uid = this.currentUid;
    return runInInjectionContext(this.injector, async () => {
      const ids: string[] = [];
      for (let i = 0; i < samples.length; i++) {
        const color = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
        const ref = await addDoc(this.col, {
          ...samples[i],
          color: color.bg,
          textColor: color.text,
          ownerId: uid,
          createdAt: new Date().toISOString(),
        });
        ids.push(ref.id);
      }
      return ids;
    });
  }
}