import { Component, inject, signal, computed, ViewEncapsulation, ViewChild, HostListener } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { DayViewComponent } from './components/day-view/day-view.component';
import { AppointmentModalComponent } from './components/appointment-modal/appointment-modal.component';
import { PatientDetailsComponent } from './components/patient-details/patient-details.component';
import { PatientHistoryComponent } from './components/patient-history/patient-history.component';
import { PatientSearchComponent } from './components/patient-search/patient-search.component';
import { WeekViewComponent } from './components/week-view/week-view.component';
import { DoctorService } from './services/doctor.service';
import { AppointmentService } from './services/appointment.service';
import { Appointment, AppointmentStatus } from './models/appointment.model';

@Component({
  selector: 'app-root',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [NavbarComponent, CalendarComponent, DayViewComponent, AppointmentModalComponent, PatientDetailsComponent, PatientHistoryComponent, PatientSearchComponent, WeekViewComponent],
  template: `
    <app-navbar (search)="showSearch.set(true)" />
    <div class="ms-main">
      <div class="ms-left-panel">
        <app-calendar
          [selectedDate]="selectedDate()"
          [datesWithAppts]="datesWithAppts()"
          (dateSelected)="selectedDate.set($event)" />
      </div>
      <div class="ms-right-panel">
        <div class="ms-view-toggle">
          <button class="ms-toggle-btn" [class.active]="viewMode() === 'day'" (click)="viewMode.set('day')">Day</button>
          <button class="ms-toggle-btn ms-toggle-week" [class.active]="viewMode() === 'week'" (click)="viewMode.set('week')">Week</button>
        </div>
        @if (viewMode() === 'day') {
          <app-day-view
            [selectedDate]="selectedDate()"
            [appointments]="dayAppointments()"
            (dateChanged)="selectedDate.set($event)"
            (apptClicked)="openAppt($event)"
            (newAppt)="openNew($event)"
            (apptDeletedForDoctor)="onDeleteDoctorAppts($event)" />
        } @else {
          <app-week-view
            [selectedDate]="selectedDate()"
            (dateChanged)="selectedDate.set($event)"
            (dayClicked)="selectedDate.set($event); viewMode.set('day')"
            (apptClicked)="openAppt($event)"
            (newAppt)="openNew($event)" />
        }
      </div>
    </div>

    @if (showSearch()) {
      <app-patient-search
        (closed)="showSearch.set(false)"
        (apptClicked)="onSearchApptClicked($event)" />
    }
    @if (historyAppt()) {
      <app-patient-history
        [appointment]="historyAppt()!"
        (closed)="historyAppt.set(null)"
        (apptSelected)="onHistoryApptSelected($event)"
        (viewDetails)="historyAppt.set(null); detailAppt.set($event)" />
    }
    @if (detailAppt()) {
      <app-patient-details
        [appointment]="detailAppt()!"
        (closed)="detailAppt.set(null)"
        (deleted)="onDelete($event); detailAppt.set(null)"
        (edited)="onEditFromDetails($event)"
        (statusChanged)="onStatusChange($event)"
        (history)="detailAppt.set(null); historyAppt.set($event)"
        (duplicated)="onDuplicate($event)" />
    }
    @if (modalAppt() !== undefined) {
      <app-appointment-modal
        [appointment]="modalAppt() ?? null"
        [defaultHour]="defaultHour()"
        [defaultMinute]="defaultMinute()"
        [defaultDoctorId]="defaultDoctorId()"
        [duplicateSource]="duplicateSource()"

        [defaultDate]="selectedDate()"
        (closed)="closeModal()"
        (saved)="onSave($event)"
        (deleted)="onDelete($event)" />
    }
  `,
  styles: [`
    :root, [data-theme="light"] {
      --soig-accent: #0072D1;
      --soig-surface: #FFFFFF;
      --soig-surface-2: #F4F7FB;
      --soig-surface-3: #E8EDF4;
      --soig-ink: #1B2A3B;
      --soig-ink-2: #4A5568;
      --soig-ink-3: #8A9BB0;
      --soig-border: rgba(0,0,0,0.08);
      --soig-border-2: rgba(0,0,0,0.14);
      --soig-radius: 6px;
      --ms-hour-bg: #ffffff;
      --soig-appt-name: #1B2A3B;
      --soig-appt-meta: #4A5568;
    }
    [data-theme="dark"] {
      --soig-accent: #4DA3FF;
      --soig-surface: #1B2330;
      --soig-surface-2: #232D3E;
      --soig-surface-3: #2C3A50;
      --soig-ink: #E8EDF4;
      --soig-ink-2: #A8B8CC;
      --soig-ink-3: #5A7290;
      --soig-border: rgba(255,255,255,0.07);
      --soig-border-2: rgba(255,255,255,0.12);
      --soig-radius: 6px;
      --ms-hour-bg: #1B2A3B;
      --soig-appt-name: #1B2A3B;
      --soig-appt-meta: #2D3E52;
    }
    *, *::before, *::after { box-sizing: border-box; }

    /* Desktop */
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--soig-surface-2); color: var(--soig-ink); font-size: 14px; }
    .ms-main { display: flex; height: calc(100vh - 56px); overflow: hidden; }
    .ms-left-panel { width: 240px; flex-shrink: 0; background: var(--soig-surface); border-right: 1px solid var(--soig-border); overflow-y: auto; }
    .ms-right-panel { flex: 1; background: var(--soig-surface); display: flex; flex-direction: column; overflow: hidden; }
    .ms-view-toggle { display: flex; border-bottom: 1px solid var(--soig-border); padding: 8px 16px; gap: 4px; flex-shrink: 0; background: var(--soig-surface); }
    .ms-toggle-btn { background: none; border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 5px 14px; font-size: 13px; cursor: pointer; color: var(--soig-ink-2); font-family: inherit; }
    .ms-toggle-btn.active { background: #0072D1; color: #fff; border-color: #0072D1; }
    .ms-toggle-week { display: none; }
    @media (min-width: 641px) { .ms-toggle-week { display: block; } }

    /* Mobile */
    @media (max-width: 640px) {
      html, body { overflow: auto; height: auto; }
      .ms-main { flex-direction: column; height: auto; overflow: visible; }
      .ms-left-panel { width: 100%; border-right: none; border-bottom: 1px solid var(--soig-border); overflow-y: visible; }
      .ms-right-panel { min-height: 100vh; overflow: visible; display: block; }
    }
  `]
})
export class App {
  @ViewChild(AppointmentModalComponent) modalRef?: AppointmentModalComponent;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    // Ignore if typing in an input/textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
      e.preventDefault();
      this.showSearch.set(true);
    }
    if (e.key === 'Escape') {
      this.showSearch.set(false);
      this.modalAppt.set(undefined);
      this.detailAppt.set(null);
      this.historyAppt.set(null);
    }
  }
  private docSvc = inject(DoctorService);
  detailAppt = signal<Appointment | null>(null);
  historyAppt = signal<Appointment | null>(null);
  showSearch = signal(false);
  viewMode = signal<'day' | 'week'>('day');
  private svc = inject(AppointmentService);

  selectedDate = signal(new Date().toISOString().split('T')[0]);
  modalAppt = signal<Appointment | null | undefined>(undefined);
  defaultHour = signal(9);
  defaultMinute = signal(0);
  defaultDoctorId = signal('');
  editingId = signal<string | null>(null);
  duplicateSource = signal<Appointment | null>(null);

  datesWithAppts = this.svc.getDatesWithAppointments();
  dayAppointments = computed(() => this.svc.getByDate(this.selectedDate())());

  openAppt(appt: Appointment) { this.detailAppt.set(appt); }
  openNew(slot: { hour: number; minute: number; doctorId: string }) {
    this.defaultHour.set(slot.hour);
    this.defaultMinute.set(slot.minute);
    this.defaultDoctorId.set(slot.doctorId);
    this.duplicateSource.set(null);
    this.modalAppt.set(null);
  }
  closeModal() { this.modalAppt.set(undefined); }

  onSave(event: { data: Partial<Appointment>; editId: string | null }) {
    const data = event.data;
    const apptData = {
      patientName: data.patientName!,
      phone: data.phone || '',
      date: data.date || this.selectedDate(),
      hour: data.hour!,
      minute: data.minute || 0,
      duration: data.duration || 30,
      doctorId: data.doctorId || 'doc1',
      type: data.type!,
      status: (data as any).status || 'scheduled',
      notes: data.notes || '',
    };
    const editId = event.editId;
    if (this.svc.hasOverlap(apptData, editId || undefined)) {
      this.modalRef?.setOverlapError(true);
      return;
    }
    if (editId) {
      this.svc.update(editId, apptData);
    } else {
      this.svc.add(apptData);
    }
    this.closeModal();
  }

  onDuplicate(appt: Appointment) {
    this.detailAppt.set(null);
    this.defaultHour.set(appt.hour);
    this.defaultMinute.set(appt.minute);
    this.defaultDoctorId.set(appt.doctorId);
    // Open modal pre-filled but as new appointment
    this.editingId.set(null);
    this.modalAppt.set(null);
    // Pre-fill form via a special signal
    this.duplicateSource.set(appt);
  }

  onEditFromDetails(appt: Appointment) {
    this.detailAppt.set(null);
    this.editingId.set(null);
    this.duplicateSource.set(null);
    this.defaultHour.set(appt.hour);
    this.defaultMinute.set(appt.minute);
    this.modalAppt.set(appt);
  }

  onDelete(id: string) { this.svc.remove(id); }

  onSearchApptClicked(appt: Appointment) {
    this.showSearch.set(false);
    this.selectedDate.set(appt.date);
    this.detailAppt.set(appt);
  }

  onHistoryApptSelected(appt: Appointment) {
    this.historyAppt.set(null);
    this.detailAppt.set(appt);
    this.selectedDate.set(appt.date);
  }

  onStatusChange(event: { id: string; status: AppointmentStatus }) {
    this.svc.update(event.id, { status: event.status });
    // Update detailAppt so panel reflects new status immediately
    const updated = this.svc.getAll().find(a => a.id === event.id);
    if (updated) this.detailAppt.set({ ...updated });
  }

  onDeleteDoctorAppts(doctorId: string) {
    this.svc.removeByDoctor(doctorId);
  }
}