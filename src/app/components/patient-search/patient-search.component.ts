import { Component, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ps-overlay" (click)="onOverlayClick($event)">
      <div class="ps-panel">

        <!-- Search input -->
        <div class="ps-search-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ps-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input #searchInput class="ps-input" [(ngModel)]="query" placeholder="Search patients by name..." autofocus>
          <button class="ps-close-btn" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Results -->
        <div class="ps-results">
          @if (query().length < 2) {
            <div class="ps-hint">Type at least 2 characters to search</div>
          } @else if (results().length === 0) {
            <div class="ps-hint">No patients found for "{{ query() }}"</div>
          } @else {
            <div class="ps-results-count">{{ results().length }} result{{ results().length !== 1 ? 's' : '' }}</div>
            @for (group of groupedResults(); track group.name) {
              <div class="ps-patient-group">
                <div class="ps-patient-header">
                  <div class="ps-patient-avatar">{{ initials(group.name) }}</div>
                  <div class="ps-patient-name">{{ group.name }}</div>
                  <div class="ps-patient-count">{{ group.appointments.length }} appointment{{ group.appointments.length !== 1 ? 's' : '' }}</div>
                </div>
                @for (appt of group.appointments; track appt.id) {
                  <div class="ps-appt-row" (click)="apptClicked.emit(appt); closed.emit()">
                    <div class="ps-appt-date">
                      <div class="ps-appt-day">{{ formatDay(appt.date) }}</div>
                      <div class="ps-appt-month">{{ formatMonth(appt.date) }}</div>
                    </div>
                    <div class="ps-appt-info">
                      <div class="ps-appt-time">{{ formatTime(appt.hour, appt.minute) }} · {{ getDuration(appt.duration) }}</div>
                      <div class="ps-appt-doctor">{{ getDoctor(appt.doctorId) }}</div>
                    </div>
                    <div class="ps-appt-right">
                      <span class="ps-type-badge" [style.background]="getType(appt.type)?.bg" [style.color]="getType(appt.type)?.color">{{ getType(appt.type)?.label }}</span>
                      <span class="ps-status-icon" [style.color]="getStatus(appt.status)?.color">{{ getStatus(appt.status)?.icon }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ps-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-start; justify-content: center; z-index: 999; padding: 80px 1rem 1rem; }
    .ps-panel { background: var(--soig-surface); border-radius: 14px; border: 1px solid var(--soig-border); width: 100%; max-width: 560px; max-height: 70vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }

    .ps-search-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--soig-border); }
    .ps-search-icon { color: var(--soig-ink-3); flex-shrink: 0; }
    .ps-input { flex: 1; border: none; background: transparent; font-size: 15px; color: var(--soig-ink); font-family: inherit; outline: none; }
    .ps-input::placeholder { color: var(--soig-ink-3); }
    .ps-close-btn { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); padding: 4px; border-radius: 4px; display: flex; flex-shrink: 0; }
    .ps-close-btn:hover { background: var(--soig-surface-2); color: var(--soig-ink); }

    .ps-results { flex: 1; overflow-y: auto; }
    .ps-hint { text-align: center; color: var(--soig-ink-3); font-size: 13px; padding: 2rem; }
    .ps-results-count { font-size: 11px; font-weight: 600; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px 4px; }

    .ps-patient-group { border-bottom: 1px solid var(--soig-border); }
    .ps-patient-group:last-child { border-bottom: none; }
    .ps-patient-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px 6px; }
    .ps-patient-avatar { width: 28px; height: 28px; border-radius: 50%; background: #0072D1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; }
    .ps-patient-name { font-size: 14px; font-weight: 600; color: var(--soig-ink); flex: 1; }
    .ps-patient-count { font-size: 11px; color: var(--soig-ink-3); }

    .ps-appt-row { display: flex; align-items: center; gap: 10px; padding: 8px 16px 8px 54px; cursor: pointer; }
    .ps-appt-row:hover { background: var(--soig-surface-2); }
    .ps-appt-date { width: 34px; text-align: center; flex-shrink: 0; background: var(--soig-surface-2); border-radius: 5px; padding: 3px 2px; }
    .ps-appt-day { font-size: 14px; font-weight: 700; color: var(--soig-ink); line-height: 1; }
    .ps-appt-month { font-size: 9px; color: var(--soig-ink-3); text-transform: uppercase; }
    .ps-appt-info { flex: 1; min-width: 0; }
    .ps-appt-time { font-size: 13px; font-weight: 500; color: var(--soig-ink); }
    .ps-appt-doctor { font-size: 11px; color: var(--soig-ink-3); margin-top: 1px; }
    .ps-appt-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .ps-type-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }
    .ps-status-icon { font-size: 13px; }
  `]
})
export class PatientSearchComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() apptClicked = new EventEmitter<Appointment>();

  private svc = inject(AppointmentService);
  private docSvc = inject(DoctorService);

  query = signal('');

  results = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (q.length < 2) return [];
    return this.svc.getAll().filter(a =>
      a.patientName.toLowerCase().includes(q)
    ).sort((a, b) => a.date.localeCompare(b.date));
  });

  groupedResults = computed(() => {
    const groups = new Map<string, Appointment[]>();
    for (const appt of this.results()) {
      if (!groups.has(appt.patientName)) groups.set(appt.patientName, []);
      groups.get(appt.patientName)!.push(appt);
    }
    return Array.from(groups.entries()).map(([name, appointments]) => ({ name, appointments }));
  });

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getType(type: string) { return APPOINTMENT_TYPES.find(t => t.value === type); }
  getStatus(status: string) { return APPOINTMENT_STATUSES.find(s => s.value === status); }
  getDoctor(id: string) { return this.docSvc.getById(id)?.name || 'Unknown'; }

  getDuration(duration: number) {
    if (!duration) return '';
    if (duration < 60) return duration + ' min';
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }

  formatDay(dateStr: string) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d).getDate();
  }

  formatMonth(dateStr: string) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleString('default', { month: 'short' });
  }

  formatTime(hour: number, minute: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ps-overlay')) this.closed.emit();
  }
}