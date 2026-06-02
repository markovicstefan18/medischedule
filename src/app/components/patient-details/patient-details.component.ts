import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Appointment, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, AppointmentStatus } from '../../models/appointment.model';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  template: `
    <div class="pd-overlay" (click)="onOverlayClick($event)">
      <div class="pd-panel">

        <!-- Header -->
        <div class="pd-header">
          <div class="pd-avatar">{{ initials() }}</div>
          <div class="pd-header-info">
            <div class="pd-name">{{ appointment.patientName }}</div>
            <div class="pd-phone">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.61a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {{ appointment.phone || 'No phone number' }}
            </div>
          </div>
          <button class="pd-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Appointment details -->
        <div class="pd-section">
          <div class="pd-section-title">Appointment</div>
          <div class="pd-card">
            <div class="pd-row">
              <span class="pd-label">Date</span>
              <span class="pd-value">{{ formatDate(appointment.date) }}</span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Time</span>
              <span class="pd-value">{{ formatTime(appointment.hour, appointment.minute) }}</span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Duration</span>
              <span class="pd-value">{{ getDurationLabel(appointment.duration) }}</span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Type</span>
              <span class="pd-type-badge"
                [style.background]="getType(appointment.type)?.bg"
                [style.color]="getType(appointment.type)?.color">
                {{ getType(appointment.type)?.label }}
              </span>
            </div>
            <div class="pd-row">
              <span class="pd-label">Status</span>
              <div class="pd-status-pills">
                @for (s of statuses; track s.value) {
                  <button class="pd-status-pill"
                    [class.active]="appointment.status === s.value"
                    [style.color]="s.color"
                    [style.background]="appointment.status === s.value ? s.bg : 'transparent'"
                    [style.border-color]="appointment.status === s.value ? s.color : 'var(--soig-border-2)'"
                    (click)="statusChanged.emit({ id: appointment.id, status: s.value })">
                    {{ s.icon }} {{ s.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        @if (appointment.notes) {
          <div class="pd-section">
            <div class="pd-section-title">Notes</div>
            <div class="pd-notes">{{ appointment.notes }}</div>
          </div>
        }

        <!-- Actions -->
        <div class="pd-actions">
          <button class="pd-btn pd-btn-history" (click)="history.emit(appointment)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </button>
          <button class="pd-btn pd-btn-history" (click)="duplicated.emit(appointment)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Duplicate
          </button>
          <button class="pd-btn pd-btn-danger" (click)="deleted.emit(appointment.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
            Delete
          </button>
          <button class="pd-btn pd-btn-secondary" (click)="closed.emit()">Close</button>
          <button class="pd-btn pd-btn-primary" (click)="edited.emit(appointment)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .pd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .pd-panel { background: var(--soig-surface); border-radius: 14px; border: 1px solid var(--soig-border); width: 100%; max-width: 420px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }

    /* Header */
    .pd-header { display: flex; align-items: center; gap: 14px; padding: 20px; border-bottom: 1px solid var(--soig-border); }
    .pd-avatar { width: 46px; height: 46px; border-radius: 50%; background: #0072D1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; flex-shrink: 0; }
    .pd-header-info { flex: 1; min-width: 0; }
    .pd-name { font-size: 16px; font-weight: 600; color: var(--soig-ink); }
    .pd-phone { font-size: 13px; color: var(--soig-ink-3); margin-top: 3px; display: flex; align-items: center; gap: 5px; }
    .pd-close { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); padding: 6px; border-radius: 6px; display: flex; flex-shrink: 0; }
    .pd-close:hover { background: var(--soig-surface-2); color: var(--soig-ink); }

    /* Sections */
    .pd-section { padding: 16px 20px; }
    .pd-section-title { font-size: 11px; font-weight: 600; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .pd-card { background: var(--soig-surface-2); border-radius: 10px; padding: 4px 0; }
    .pd-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--soig-border); }
    .pd-row:last-child { border-bottom: none; }
    .pd-label { font-size: 13px; color: var(--soig-ink-3); }
    .pd-value { font-size: 13px; color: var(--soig-ink); font-weight: 500; }
    .pd-type-badge { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
    .pd-status-pills { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; max-width: 260px; }
    .pd-status-pill { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 20px; border: 1px solid; cursor: pointer; font-family: inherit; transition: all 0.1s; background: transparent; }
    .pd-status-pill:hover { opacity: 0.8; }
    .pd-status-pill.active { font-weight: 600; }
    .pd-notes { font-size: 13px; color: var(--soig-ink-2); line-height: 1.7; background: var(--soig-surface-2); border-radius: 10px; padding: 12px 14px; }

    /* Actions */
    .pd-actions { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--soig-border); margin-top: auto; }
    .pd-btn { border-radius: 8px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: inherit; border: 1px solid transparent; display: flex; align-items: center; gap: 6px; }
    .pd-btn-primary { background: #0072D1; color: #fff; border-color: #0072D1; margin-left: auto; }
    .pd-btn-primary:hover { background: #004E8C; }
    .pd-btn-secondary { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); }
    .pd-btn-secondary:hover { background: var(--soig-surface-2); }
    .pd-btn-danger { background: var(--soig-surface); color: #C21016; border-color: #C21016; }
    .pd-btn-history { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); display: flex; align-items: center; gap: 5px; }
    .pd-btn-history:hover { background: var(--soig-surface-2); }
    .pd-btn-danger:hover { background: #FDECEA; }
  `]
})
export class PatientDetailsComponent {
  @Input() appointment!: Appointment;
  @Output() closed = new EventEmitter<void>();
  @Output() edited = new EventEmitter<Appointment>();
  @Output() deleted = new EventEmitter<string>();
  @Output() statusChanged = new EventEmitter<{ id: string; status: AppointmentStatus }>();
  @Output() history = new EventEmitter<Appointment>();
  @Output() duplicated = new EventEmitter<Appointment>();
  statuses = APPOINTMENT_STATUSES;

  initials() {
    return this.appointment.patientName
      .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getType(type: string) {
    return APPOINTMENT_TYPES.find(t => t.value === type);
  }

  getDurationLabel(duration: number) {
    if (!duration) return '—';
    if (duration < 60) return duration + ' min';
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }

  formatDate(dateStr: string) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  formatTime(hour: number, minute: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('pd-overlay')) {
      this.closed.emit();
    }
  }
}