import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentType, APPOINTMENT_TYPES, HOURS, DURATIONS, MINUTES } from '../../models/appointment.model';
import { DoctorService } from '../../services/doctor.service';
@Component({
  selector: 'app-appointment-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ms-modal-overlay" (click)="onOverlayClick($event)">
      <div class="ms-modal">
        <div class="ms-modal-header">
          <h2 class="ms-modal-title">{{ mode === 'view' ? 'Appointment details' : mode === 'edit' ? 'Edit appointment' : isDuplicate ? 'Duplicate appointment' : 'New appointment' }}</h2>
          <button class="ms-modal-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        @if (mode === 'view' && appointment) {
          <div class="ms-modal-body">
            <div class="ms-detail-row">
              <span class="ms-detail-label">Patient</span>
              <span class="ms-detail-value">{{ appointment.patientName }}</span>
            </div>
            <div class="ms-detail-row">
              <span class="ms-detail-label">Phone</span>
              <span class="ms-detail-value">{{ appointment.phone }}</span>
            </div>
            <div class="ms-detail-row">
              <span class="ms-detail-label">Time</span>
              <span class="ms-detail-value">{{ formatTime(appointment.hour, appointment.minute) }}</span>
            </div>
            <div class="ms-detail-row">
              <span class="ms-detail-label">Duration</span>
              <span class="ms-detail-value">{{ getDurationLabel(appointment.duration) }}</span>
            </div>
            <div class="ms-detail-row">
              <span class="ms-detail-label">Type</span>
              <span class="ms-type-badge" [style.background]="getType(appointment.type)?.bg" [style.color]="getType(appointment.type)?.color">
                {{ getType(appointment.type)?.label }}
              </span>
            </div>
            @if (appointment.notes) {
              <div class="ms-detail-notes-label">Notes</div>
              <div class="ms-detail-notes">{{ appointment.notes }}</div>
            }
          </div>
          <div class="ms-modal-footer">
            <button class="ms-btn ms-btn-danger" (click)="onDelete()">Delete</button>
            <button class="ms-btn ms-btn-secondary" (click)="switchToEdit()">Edit</button>
          </div>
        }
        @if (mode === 'edit' || mode === 'new') {
          <div class="ms-modal-body">
            <div class="ms-form-field">
              <label class="ms-form-label">Patient name *</label>
              <input class="ms-form-input" [(ngModel)]="form.patientName" placeholder="Full name">
            </div>
            <div class="ms-form-field">
              <label class="ms-form-label">Phone number</label>
              <input class="ms-form-input" [(ngModel)]="form.phone" placeholder="+1 555 000 0000" type="tel">
            </div>
            @if (isDuplicate) {
              <div class="ms-form-field">
                <label class="ms-form-label">New date *</label>
                <input class="ms-form-input" [(ngModel)]="form.date" type="date">
              </div>
            }
            <div class="ms-form-field">
              <label class="ms-form-label">Doctor *</label>
              <select class="ms-form-input" [(ngModel)]="form.doctorId">
                <option value="" disabled>Select doctor</option>
                @for (doc of docSvc.getAll()(); track doc.id) {
                  <option [value]="doc.id">{{ doc.name }} — {{ doc.specialty }}</option>
                }
              </select>
            </div>
            <div class="ms-form-row">
              <div class="ms-form-field">
                <label class="ms-form-label">Hour</label>
                <select class="ms-form-input" [(ngModel)]="form.hour">
                  @for (h of hours; track h) {
                    <option [value]="h">{{ formatHour(h) }}</option>
                  }
                </select>
              </div>
              <div class="ms-form-field">
                <label class="ms-form-label">Minute</label>
                <select class="ms-form-input" [(ngModel)]="form.minute">
                  @for (m of minutes; track m) {
                    <option [value]="m">:{{ m.toString().padStart(2, '0') }}</option>
                  }
                </select>
              </div>
              <div class="ms-form-field">
                <label class="ms-form-label">Duration</label>
                <select class="ms-form-input" [(ngModel)]="form.duration">
                  @for (d of durations; track d.value) {
                    <option [value]="d.value">{{ d.label }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="ms-form-field">
              <label class="ms-form-label">Appointment type</label>
              <div class="ms-type-grid">
                @for (t of types; track t.value) {
                  <div class="ms-type-option" [class.selected]="form.type === t.value"
                    [style.border-color]="form.type === t.value ? t.border : ''"
                    [style.background]="form.type === t.value ? t.bg : ''"
                    (click)="form.type = t.value">
                    <span class="ms-type-dot" [style.background]="t.border"></span>
                    <span [style.color]="form.type === t.value ? t.color : ''">{{ t.label }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="ms-form-field">
              <label class="ms-form-label">Notes</label>
              <textarea class="ms-form-input ms-form-textarea" [(ngModel)]="form.notes" placeholder="Any relevant notes..." rows="3"></textarea>
            </div>
          </div>
          @if (overlapError) {
            <div class="ms-overlap-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              This time overlaps with an existing appointment.
            </div>
          }
          <div class="ms-modal-footer">
            <button class="ms-btn ms-btn-secondary" (click)="closed.emit()">Cancel</button>
            <button class="ms-btn ms-btn-primary" (click)="onSave()" [disabled]="!form.patientName || !form.doctorId || (isDuplicate && !form.date)">
              {{ mode === 'edit' ? 'Save changes' : 'Add appointment' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ms-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .ms-modal { background: var(--soig-surface); border-radius: 12px; border: 1px solid var(--soig-border); width: 100%; max-width: 460px; max-height: 90vh; display: flex; flex-direction: column; }
    .ms-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--soig-border); }
    .ms-modal-title { font-size: 15px; font-weight: 600; color: var(--soig-ink); }
    .ms-modal-close { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); padding: 4px; border-radius: 4px; display: flex; }
    .ms-modal-close:hover { background: var(--soig-surface-2); color: var(--soig-ink); }
    .ms-modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .ms-modal-footer { padding: 12px 20px; border-top: 1px solid var(--soig-border); display: flex; justify-content: flex-end; gap: 8px; }
    .ms-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--soig-border); }
    .ms-detail-row:last-of-type { border-bottom: none; }
    .ms-detail-label { font-size: 12px; color: var(--soig-ink-3); }
    .ms-detail-value { font-size: 14px; color: var(--soig-ink); font-weight: 500; }
    .ms-type-badge { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
    .ms-detail-notes-label { font-size: 12px; color: var(--soig-ink-3); margin-top: 12px; margin-bottom: 6px; }
    .ms-detail-notes { font-size: 13px; color: var(--soig-ink-2); line-height: 1.6; background: var(--soig-surface-2); border-radius: 6px; padding: 10px 12px; }
    .ms-form-field { margin-bottom: 14px; }
    .ms-form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .ms-form-label { font-size: 12px; color: var(--soig-ink-2); display: block; margin-bottom: 5px; font-weight: 500; }
    .ms-form-input { width: 100%; border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--soig-ink); background: var(--soig-surface); font-family: inherit; }
    .ms-form-input:focus { outline: none; border-color: #0072D1; }
    .ms-form-textarea { resize: vertical; min-height: 72px; }
    .ms-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .ms-type-option { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--soig-border-2); border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--soig-ink-2); transition: all 0.1s; }
    .ms-type-option:hover { border-color: #0072D1; }
    .ms-type-option.selected { font-weight: 500; }
    .ms-type-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ms-btn { border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; border: 1px solid transparent; }
    .ms-btn-primary { background: #0072D1; color: #fff; border-color: #0072D1; }
    .ms-btn-primary:hover { background: #004E8C; }
    .ms-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .ms-btn-secondary { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); }
    .ms-btn-secondary:hover { background: var(--soig-surface-2); }
    .ms-btn-danger { background: var(--soig-surface); color: #C21016; border-color: #C21016; }
    .ms-btn-danger:hover { background: #FDECEA; }
    .ms-overlap-error { display:flex; align-items:center; gap:6px; font-size:12px; color:#C21016; padding:0 20px 8px; }
  `]
})
export class AppointmentModalComponent implements OnInit {
  @Input() appointment: Appointment | null = null;
  @Input() defaultHour: number = 9;
  @Input() defaultMinute: number = 0;
  @Input() defaultDate: string = '';
  @Input() defaultDoctorId: string = '';
  @Input() set duplicateSource(appt: any) {
    if (!appt) { this.isDuplicate = false; return; }
    this.isDuplicate = true;
    this.form.patientName = appt.patientName;
    this.form.phone = appt.phone || '';
    this.form.date = '';
    this.form.hour = appt.hour;
    this.form.minute = appt.minute;
    this.form.duration = appt.duration || 30;
    this.form.type = appt.type;
    this.form.notes = appt.notes || '';
    this.form.doctorId = appt.doctorId;
  }
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ data: Partial<Appointment>; editId: string | null }>();
  overlapError = false;
  @Output() deleted = new EventEmitter<string>();
  docSvc = inject(DoctorService);
  mode: 'view' | 'edit' | 'new' = 'view';
  types = APPOINTMENT_TYPES;
  hours = HOURS;
  minutes = MINUTES;
  durations = DURATIONS;
  isDuplicate = false;
  form = {
    patientName: '',
    phone: '',
    date: '',
    hour: 9,
    minute: 0,
    duration: 30,
    type: 'checkup' as AppointmentType,
    notes: '',
    doctorId: '',
  };
  ngOnInit() {
    if (this.appointment) {
      this.switchToEdit();
      return;
    } else {
      this.mode = 'new';
      this.form.hour = this.defaultHour;
      this.form.minute = this.defaultMinute;
      this.form.doctorId = this.defaultDoctorId;
    }
  }
  editId: string | null = null;
  switchToEdit() {
    if (this.appointment) {
      this.editId = this.appointment.id;
      this.form = {
        patientName: this.appointment.patientName,
        phone: this.appointment.phone,
        date: this.appointment.date,
        hour: this.appointment.hour,
        minute: this.appointment.minute,
        duration: this.appointment.duration,
        type: this.appointment.type,
        notes: this.appointment.notes,
        doctorId: this.appointment.doctorId,
      };
      this.mode = 'edit';
    }
  }
  getType(type: AppointmentType) {
    return APPOINTMENT_TYPES.find(t => t.value === type);
  }
  getDurationLabel(duration: number) {
    return DURATIONS.find(d => d.value === duration)?.label || `${duration} min`;
  }
  formatTime(hour: number, minute: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }
  formatHour(h: number) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h;
    return `${hour} ${ampm}`;
  }
  onSave() {
    if (!this.form.patientName) return;
    this.overlapError = false;
    // New appointments default to the selected day; edits and duplicates keep form.date.
    const date = (this.mode === 'new' && !this.isDuplicate) ? this.defaultDate : this.form.date;
    this.saved.emit({ data: { ...this.form, date }, editId: this.editId });
  }
  onDelete() {
    if (this.appointment) {
      this.deleted.emit(this.appointment.id);
      this.closed.emit();
    }
  }
  setOverlapError(val: boolean) { this.overlapError = val; }
  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('ms-modal-overlay')) {
      this.closed.emit();
    }
  }
}