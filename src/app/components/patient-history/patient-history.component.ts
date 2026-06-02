import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { Appointment, APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  template: `
    <div class="ph-overlay" (click)="onOverlayClick($event)">
      <div class="ph-panel">

        <!-- Header -->
        <div class="ph-header">
          <div class="ph-avatar">{{ initials() }}</div>
          <div class="ph-header-info">
            <div class="ph-name">{{ appointment.patientName }}</div>
            <div class="ph-sub">{{ appointment.phone || 'No phone' }} · {{ allAppts().length }} appointment{{ allAppts().length !== 1 ? 's' : '' }}</div>
          </div>
          <button class="ph-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Stats -->
        <div class="ph-stats">
          <div class="ph-stat">
            <div class="ph-stat-value">{{ upcomingAppts().length }}</div>
            <div class="ph-stat-label">Upcoming</div>
          </div>
          <div class="ph-stat">
            <div class="ph-stat-value">{{ completedAppts().length }}</div>
            <div class="ph-stat-label">Completed</div>
          </div>
          <div class="ph-stat">
            <div class="ph-stat-value">{{ noshowAppts().length }}</div>
            <div class="ph-stat-label">No-shows</div>
          </div>
        </div>

        <!-- Appointment list -->
        <div class="ph-body">
          @if (upcomingAppts().length > 0) {
            <div class="ph-section-title">Upcoming</div>
            @for (appt of upcomingAppts(); track appt.id) {
              <div class="ph-appt-row" [class.active]="appt.id === appointment.id" (click)="apptSelected.emit(appt)">
                <div class="ph-appt-date">
                  <div class="ph-appt-day">{{ formatDay(appt.date) }}</div>
                  <div class="ph-appt-month">{{ formatMonth(appt.date) }}</div>
                </div>
                <div class="ph-appt-info">
                  <div class="ph-appt-time">{{ formatTime(appt.hour, appt.minute) }} · {{ getDuration(appt.duration) }}</div>
                  <div class="ph-appt-doctor">{{ getDoctor(appt.doctorId) }}</div>
                </div>
                <div class="ph-appt-right">
                  <span class="ph-type-badge" [style.background]="getType(appt.type)?.bg" [style.color]="getType(appt.type)?.color">{{ getType(appt.type)?.label }}</span>
                  <span class="ph-status-icon" [style.color]="getStatus(appt.status)?.color">{{ getStatus(appt.status)?.icon }}</span>
                </div>
              </div>
            }
          }

          @if (pastAppts().length > 0) {
            <div class="ph-section-title" style="margin-top:16px">Past</div>
            @for (appt of pastAppts(); track appt.id) {
              <div class="ph-appt-row past" [class.active]="appt.id === appointment.id" (click)="apptSelected.emit(appt)">
                <div class="ph-appt-date">
                  <div class="ph-appt-day">{{ formatDay(appt.date) }}</div>
                  <div class="ph-appt-month">{{ formatMonth(appt.date) }}</div>
                </div>
                <div class="ph-appt-info">
                  <div class="ph-appt-time">{{ formatTime(appt.hour, appt.minute) }} · {{ getDuration(appt.duration) }}</div>
                  <div class="ph-appt-doctor">{{ getDoctor(appt.doctorId) }}</div>
                </div>
                <div class="ph-appt-right">
                  <span class="ph-type-badge" [style.background]="getType(appt.type)?.bg" [style.color]="getType(appt.type)?.color">{{ getType(appt.type)?.label }}</span>
                  <span class="ph-status-icon" [style.color]="getStatus(appt.status)?.color">{{ getStatus(appt.status)?.icon }}</span>
                </div>
              </div>
            }
          }

          @if (allAppts().length === 0) {
            <div class="ph-empty">No appointment history found</div>
          }
        </div>

        <div class="ph-footer">
          <button class="ph-btn ph-btn-secondary" (click)="closed.emit()">Close</button>
          <button class="ph-btn ph-btn-primary" (click)="viewDetails.emit(appointment)">View current appointment</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ph-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .ph-panel { background: var(--soig-surface); border-radius: 14px; border: 1px solid var(--soig-border); width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }

    .ph-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--soig-border); }
    .ph-avatar { width: 44px; height: 44px; border-radius: 50%; background: #0072D1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; flex-shrink: 0; }
    .ph-header-info { flex: 1; min-width: 0; }
    .ph-name { font-size: 16px; font-weight: 600; color: var(--soig-ink); }
    .ph-sub { font-size: 12px; color: var(--soig-ink-3); margin-top: 2px; }
    .ph-close { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); padding: 4px; border-radius: 4px; display: flex; }
    .ph-close:hover { background: var(--soig-surface-2); }

    .ph-stats { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--soig-border); }
    .ph-stat { padding: 12px; text-align: center; border-right: 1px solid var(--soig-border); }
    .ph-stat:last-child { border-right: none; }
    .ph-stat-value { font-size: 20px; font-weight: 700; color: var(--soig-ink); }
    .ph-stat-label { font-size: 11px; color: var(--soig-ink-3); margin-top: 2px; }

    .ph-body { flex: 1; overflow-y: auto; padding: 12px 16px; }
    .ph-section-title { font-size: 10px; font-weight: 700; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }

    .ph-appt-row { display: flex; align-items: center; gap: 10px; padding: 10px 10px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; margin-bottom: 4px; }
    .ph-appt-row:hover { background: var(--soig-surface-2); }
    .ph-appt-row.active { border-color: #0072D1; background: #E6F1FB; }
    .ph-appt-row.past { opacity: 0.7; }

    .ph-appt-date { width: 36px; text-align: center; flex-shrink: 0; background: var(--soig-surface-2); border-radius: 6px; padding: 4px 2px; }
    .ph-appt-day { font-size: 16px; font-weight: 700; color: var(--soig-ink); line-height: 1; }
    .ph-appt-month { font-size: 9px; color: var(--soig-ink-3); text-transform: uppercase; }

    .ph-appt-info { flex: 1; min-width: 0; }
    .ph-appt-time { font-size: 13px; font-weight: 500; color: var(--soig-ink); }
    .ph-appt-doctor { font-size: 11px; color: var(--soig-ink-3); margin-top: 2px; }

    .ph-appt-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .ph-type-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }
    .ph-status-icon { font-size: 14px; }

    .ph-empty { text-align: center; color: var(--soig-ink-3); font-size: 13px; padding: 2rem 0; }

    .ph-footer { padding: 12px 20px; border-top: 1px solid var(--soig-border); display: flex; justify-content: flex-end; gap: 8px; }
    .ph-btn { border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; border: 1px solid transparent; }
    .ph-btn-primary { background: #0072D1; color: #fff; border-color: #0072D1; }
    .ph-btn-primary:hover { background: #004E8C; }
    .ph-btn-secondary { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); }
    .ph-btn-secondary:hover { background: var(--soig-surface-2); }
  `]
})
export class PatientHistoryComponent {
  @Input() appointment!: Appointment;
  @Output() closed = new EventEmitter<void>();
  @Output() apptSelected = new EventEmitter<Appointment>();
  @Output() viewDetails = new EventEmitter<Appointment>();

  private svc = inject(AppointmentService);
  private docSvc = inject(DoctorService);

  today = new Date().toISOString().split('T')[0];

  allAppts = computed(() =>
    this.svc.getAll()
      .filter(a => a.patientName === this.appointment.patientName)
      .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)
  );

  upcomingAppts = computed(() => this.allAppts().filter(a => a.date >= this.today));
  pastAppts = computed(() => this.allAppts().filter(a => a.date < this.today).reverse());
  completedAppts = computed(() => this.allAppts().filter(a => a.status === 'completed'));
  noshowAppts = computed(() => this.allAppts().filter(a => a.status === 'noshow'));

  initials() {
    return this.appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    if ((e.target as HTMLElement).classList.contains('ph-overlay')) this.closed.emit();
  }
}