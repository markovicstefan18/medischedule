import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Appointment, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, HOURS } from '../../models/appointment.model';
import { DoctorService } from '../../services/doctor.service';
import { DoctorModalComponent } from '../doctor-modal/doctor-modal.component';

interface TimeSlot { hour: number; minute: number; isHourStart: boolean; label: string; }

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [DoctorModalComponent],
  template: `
    <div class="ms-day">
      <div class="ms-day-header">
        <div>
          <div class="ms-day-title">{{ formattedDate() }}</div>
          <div class="ms-day-sub">{{ appointments.length }} appointment{{ appointments.length !== 1 ? 's' : '' }}</div>
        </div>
        <div class="ms-day-actions">
          <button class="ms-nav-btn" (click)="prevDay()">‹ Prev</button>
          <button class="ms-nav-btn ms-today-btn" (click)="goToday()">Today</button>
          <button class="ms-nav-btn" (click)="nextDay()">Next ›</button>
          <button class="ms-add-btn" (click)="newAppt.emit({ hour: 9, minute: 0, doctorId: docSvc.getAll()()[0]?.id || '' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New appointment
          </button>
          <button class="ms-nav-btn ms-print-btn" (click)="printSchedule()" title="Print day schedule">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      <div class="ms-schedule">
        <!-- Single scrollable container for both time col and doctor cols -->
        <!-- Day summary bar -->
      <div class="ms-summary-bar">
        <div class="ms-summary-item">
          <span class="ms-summary-value">{{ appointments.length }}</span>
          <span class="ms-summary-label">Total</span>
        </div>
        @for (s of summaryStats(); track s.status) {
          <div class="ms-summary-item">
            <span class="ms-summary-value" [style.color]="s.color">{{ s.count }}</span>
            <span class="ms-summary-label">{{ s.label }}</span>
          </div>
        }
      </div>
      <div class="ms-scroll-area">
          <div class="ms-grid-layout">

            <!-- Time column — sticky left, scrolls vertically with grid -->
            <div class="ms-time-col">
              <div class="ms-time-header-spacer"></div>
              <div class="ms-time-spacer"></div>
              @for (slot of timeSlots; track slot.hour + ':' + slot.minute) {
                <div class="ms-time-cell" [class.hour-start]="slot.isHourStart">
                  @if (slot.isHourStart) {
                    <span class="ms-time-label">{{ slot.label }}</span>
                  }
                </div>
              }
            </div>

            <!-- Doctor columns -->
            @for (doctor of docSvc.getAll()(); track doctor.id) {
              <div class="ms-doctor-col">
                <div class="ms-doctor-header">
                  <div class="ms-doc-avatar" [style.background]="doctor.color" [style.color]="doctor.textColor">
                    {{ docSvc.initials(doctor.name) }}
                  </div>
                  <div class="ms-doc-info">
                    <div class="ms-doc-name">{{ doctor.name }}</div>
                    <div class="ms-doc-spec">{{ doctor.specialty }}</div>
                  </div>
                  <button class="ms-remove-doc-btn" (click)="confirmRemoveDoctor(doctor.id, doctor.name)" title="Remove doctor">×</button>
                </div>
                <div class="ms-col-grid">
                    <div class="ms-col-spacer"></div>
                  @for (slot of timeSlots; track slot.hour + ':' + slot.minute) {
                    <div class="ms-grid-cell" [class.hour-start]="slot.isHourStart"
                      (click)="newAppt.emit({ hour: slot.hour, minute: slot.minute, doctorId: doctor.id }); $event.stopPropagation()">
                    </div>
                  }
                  @if (currentTimeTop() !== null && isToday()) {
                    <div class="ms-current-time-line" [style.top.px]="currentTimeTop()!">
                      <div class="ms-current-time-dot"></div>
                    </div>
                  }
                  @for (appt of getApptsByDoctor(doctor.id); track appt.id) {
                    <div class="ms-appt-block"
                      [style.top.px]="getTopPx(appt)"
                      [style.height.px]="getHeightPx(appt)"
                      [style.background]="getType(appt.type)?.bg"
                      [style.border-left-color]="getType(appt.type)?.border"
                      (click)="apptClicked.emit(appt); $event.stopPropagation()">
                      <div class="ms-appt-header">
                        <div class="ms-appt-name">{{ appt.patientName }}</div>
                        <span class="ms-appt-status-dot" [style.color]="getStatus(appt.status)?.color" [title]="getStatus(appt.status)?.label">{{ getStatus(appt.status)?.icon }}</span>
                      </div>
                      <div class="ms-appt-meta">{{ formatTime(appt.hour, appt.minute) }} · {{ getDurationLabel(appt.duration) }}</div>
                      <div class="ms-appt-tooltip">
                        <div class="ms-tt-name">{{ appt.patientName }}</div>
                        <div class="ms-tt-row">
                          <span class="ms-tt-label">Time</span>
                          <span>{{ formatTime(appt.hour, appt.minute) }} · {{ getDurationLabel(appt.duration) }}</span>
                        </div>
                        <div class="ms-tt-row">
                          <span class="ms-tt-label">Type</span>
                          <span [style.color]="getType(appt.type)?.color">{{ getType(appt.type)?.label }}</span>
                        </div>
                        <div class="ms-tt-row">
                          <span class="ms-tt-label">Status</span>
                          <span [style.color]="getStatus(appt.status)?.color">{{ getStatus(appt.status)?.icon }} {{ getStatus(appt.status)?.label }}</span>
                        </div>
                        @if (appt.phone) {
                          <div class="ms-tt-row">
                            <span class="ms-tt-label">Phone</span>
                            <span>{{ appt.phone }}</span>
                          </div>
                        }
                        @if (appt.notes) {
                          <div class="ms-tt-notes">{{ appt.notes }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Add doctor column -->
            <div class="ms-add-doc-col">
              <div class="ms-add-doc-spacer"></div>
              <div class="ms-add-doc-btn" (click)="showDoctorModal.set(true)" title="Add doctor">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    @if (showDoctorModal()) {
      <app-doctor-modal (closed)="showDoctorModal.set(false)" (saved)="onAddDoctor($event)" />
    }

    @if (removeConfirm()) {
      <div class="ms-confirm-overlay" (click)="removeConfirm.set(null)">
        <div class="ms-confirm-box" (click)="$event.stopPropagation()">
          <div class="ms-confirm-title">Remove doctor?</div>
          <div class="ms-confirm-msg">Removing <strong>{{ removeConfirm()!.name }}</strong> will also delete all their appointments. This cannot be undone.</div>
          <div class="ms-confirm-actions">
            <button class="ms-btn ms-btn-secondary" (click)="removeConfirm.set(null)">Cancel</button>
            <button class="ms-btn ms-btn-danger" (click)="onRemoveDoctor()">Remove doctor</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .ms-summary-bar { display: flex; align-items: center; gap: 0; border-bottom: 1px solid var(--soig-border); background: var(--soig-surface-2); flex-shrink: 0; flex-wrap: wrap; }
    .ms-summary-item { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; border-right: 1px solid var(--soig-border); min-width: 80px; }
    .ms-summary-item:last-child { border-right: none; }
    .ms-summary-value { font-size: 18px; font-weight: 700; color: var(--soig-ink); line-height: 1; }
    .ms-summary-label { font-size: 10px; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.4px; margin-top: 3px; }
    @media (max-width: 640px) { :host { overflow: visible; min-height: 100vh; } .ms-day { overflow: visible; } .ms-schedule { overflow: visible; height: auto; } .ms-scroll-area { overflow: visible; height: auto; } }
    .ms-day { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .ms-day-header { padding: 12px 20px; border-bottom: 1px solid var(--soig-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; flex-shrink: 0; }
    .ms-day-title { font-size: 15px; font-weight: 600; color: var(--soig-ink); }
    .ms-day-sub { font-size: 12px; color: var(--soig-ink-3); margin-top: 2px; }
    .ms-day-actions { display: flex; align-items: center; gap: 8px; }
    .ms-nav-btn { background: none; border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; color: var(--soig-ink-2); font-family: inherit; }
    .ms-nav-btn:hover { background: var(--soig-surface-2); }
    .ms-today-btn { color: #0072D1; border-color: #0072D1; }
    .ms-print-btn { display: flex; align-items: center; gap: 5px; }
    .ms-add-btn { background: #0072D1; color: #fff; border: none; border-radius: 6px; padding: 7px 14px; font-size: 13px; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; }
    .ms-add-btn:hover { background: #004E8C; }

    /* Single scroll container */
    .ms-schedule { flex: 1; overflow: hidden; }
    .ms-scroll-area { width: 100%; height: 100%; overflow: auto; }
    .ms-grid-layout { display: flex; min-width: max-content; }

    /* Time column — sticky left */
    .ms-time-col { width: 64px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid var(--soig-border); position: sticky; left: 0; z-index: 10; background: var(--soig-surface); }
    .ms-time-header-spacer { height: 45px; flex-shrink: 0; border-bottom: 1px solid var(--soig-border); position: sticky; top: 0; z-index: 11; background: var(--soig-surface); }
    .ms-time-spacer { height: 20px; }
    .ms-col-spacer { height: 20px; }
    .ms-time-cell { height: 20px; display: flex; align-items: flex-start; justify-content: flex-end; padding-right: 8px; }
    .ms-time-cell.hour-start { border-top: 1px solid var(--soig-border); }
    .ms-time-label { font-size: 13px; font-weight: 500; color: var(--soig-ink-2); margin-top: -11px; display: flex; align-items: center; justify-content: center; width: 48px; height: 22px; border-radius: 11px; background: var(--ms-hour-bg, #ffffff); }

    /* Doctor columns */
    .ms-doctor-col { min-width: 180px; flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--soig-border); overflow: visible; }
    .ms-doctor-header { height: 45px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 8px; border-bottom: 1px solid var(--soig-border); background: var(--soig-surface-2); position: sticky; top: 0; z-index: 9; }
    .ms-doc-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; }
    .ms-doc-info { flex: 1; min-width: 0; }
    .ms-doc-name { font-size: 12px; font-weight: 600; color: var(--soig-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ms-doc-spec { font-size: 10px; color: var(--soig-ink-3); }
    .ms-remove-doc-btn { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); font-size: 18px; line-height: 1; padding: 0 2px; flex-shrink: 0; }
    .ms-remove-doc-btn:hover { color: #C21016; }

    /* Grid */
    .ms-col-grid { position: relative; flex: 1; overflow: visible; }
    .ms-grid-cell { height: 20px; border-top: 1px solid transparent; cursor: pointer; }
    .ms-grid-cell.hour-start { border-top-color: var(--soig-border); }
    .ms-grid-cell:not(.hour-start) { border-top: 1px dashed var(--soig-border); }
    .ms-grid-cell:hover { background: var(--soig-surface-2); }

    /* Appointments */
    .ms-current-time-line { position: absolute; left: 0; right: 0; height: 2px; background: #E24B4A; z-index: 5; pointer-events: none; }
    .ms-current-time-dot { position: absolute; left: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #E24B4A; }
    .ms-appt-block { position: absolute; left: 3px; right: 3px; border-left: 3px solid; border-radius: 0 6px 6px 0; padding: 3px 6px; cursor: pointer; overflow: hidden; z-index: 2; transition: opacity 0.1s; min-height: 20px; }
    .ms-appt-block:hover { opacity: 0.85; z-index: 30; overflow: visible; }
    .ms-appt-tooltip { display: none; position: absolute; left: calc(100% + 8px); top: 0; width: 200px; background: var(--soig-surface); border: 1px solid var(--soig-border-2); border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; pointer-events: none; }
    .ms-appt-block:hover .ms-appt-tooltip { display: block; }
    .ms-tt-name { font-size: 13px; font-weight: 600; color: var(--soig-ink); margin-bottom: 6px; }
    .ms-tt-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--soig-ink-2); padding: 2px 0; }
    .ms-tt-label { color: var(--soig-ink-3); flex-shrink: 0; }
    .ms-tt-notes { font-size: 11px; color: var(--soig-ink-2); margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--soig-border); line-height: 1.5; max-height: 48px; overflow: hidden; }
    .ms-appt-header { display: flex; align-items: center; justify-content: space-between; gap: 2px; }
    .ms-appt-name { font-size: 11px; font-weight: 600; color: var(--soig-appt-name, #1B2A3B); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
    .ms-appt-status-dot { font-size: 11px; flex-shrink: 0; line-height: 1; }
    .ms-appt-meta { font-size: 10px; color: var(--soig-appt-meta, #4A5568); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Add doctor column */
    .ms-add-doc-col { width: 52px; flex-shrink: 0; display: flex; flex-direction: column; border-left: 1px dashed var(--soig-border); }
    .ms-add-doc-spacer { height: 45px; flex-shrink: 0; border-bottom: 1px solid var(--soig-border); position: sticky; top: 0; background: var(--soig-surface); }
    .ms-add-doc-btn { width: 32px; height: 32px; border-radius: 50%; border: 1.5px dashed var(--soig-border-2); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--soig-ink-3); transition: all 0.15s; margin: 10px auto 0; }
    .ms-add-doc-btn:hover { border-color: #0072D1; color: #0072D1; background: #E8F4FF; }

    /* Confirm dialog */
    .ms-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .ms-confirm-box { background: var(--soig-surface); border-radius: 12px; border: 1px solid var(--soig-border); width: 100%; max-width: 380px; padding: 20px; }
    .ms-confirm-title { font-size: 15px; font-weight: 600; color: var(--soig-ink); margin-bottom: 10px; }
    .ms-confirm-msg { font-size: 13px; color: var(--soig-ink-2); line-height: 1.6; margin-bottom: 20px; }
    .ms-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .ms-btn { border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; border: 1px solid transparent; }
    .ms-btn-secondary { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); }
    .ms-btn-secondary:hover { background: var(--soig-surface-2); }
    .ms-btn-danger { background: #C21016; color: #fff; border-color: #C21016; }
    .ms-btn-danger:hover { background: #a01010; }
  `]
})
export class DayViewComponent implements OnInit, OnDestroy {
  private _selectedDate = signal('');
  @Input() set selectedDate(val: string) { this._selectedDate.set(val); }
  get selectedDate() { return this._selectedDate(); }
  private _appointments = signal<Appointment[]>([]);
  @Input() set appointments(val: Appointment[]) { this._appointments.set(val); }
  get appointments() { return this._appointments(); }
  @Output() dateChanged = new EventEmitter<string>();
  @Output() apptClicked = new EventEmitter<Appointment>();
  @Output() newAppt = new EventEmitter<{ hour: number; minute: number; doctorId: string }>();
  @Output() apptDeletedForDoctor = new EventEmitter<string>();

  docSvc = inject(DoctorService);
  showDoctorModal = signal(false);
  removeConfirm = signal<{ id: string; name: string } | null>(null);

  summaryStats = computed(() => {
    return APPOINTMENT_STATUSES.map(s => ({
      status: s.value,
      label: s.label,
      color: s.color,
      count: this._appointments().filter(a => a.status === s.value).length
    })).filter(s => s.count > 0);
  });

  currentTimeTop = signal<number | null>(null);
  private timeInterval: any = null;

  readonly SLOT_HEIGHT = 20;
  timeSlots: TimeSlot[] = this.buildSlots();

  ngOnInit() {
    this.updateCurrentTime();
    this.timeInterval = setInterval(() => this.updateCurrentTime(), 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  isToday(): boolean {
    return this._selectedDate() === this.toDateStr(new Date());
  }

  updateCurrentTime() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour < HOURS[0] || hour > HOURS[HOURS.length - 1]) {
      this.currentTimeTop.set(null);
      return;
    }
    const top = (hour - HOURS[0]) * 4 * this.SLOT_HEIGHT +
                (minute / 15) * this.SLOT_HEIGHT +
                this.SLOT_HEIGHT; // spacer
    this.currentTimeTop.set(top);
  }

  buildSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (const h of HOURS) {
      for (const m of [0, 15, 30, 45]) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h > 12 ? h - 12 : h;
        slots.push({ hour: h, minute: m, isHourStart: m === 0, label: `${hour} ${ampm}` });
      }
    }
    return slots;
  }

  getApptsByDoctor(doctorId: string) {
    return this._appointments().filter(a => a.doctorId === doctorId);
  }

  getTopPx(appt: Appointment): number {
    const hourOffset = (appt.hour - HOURS[0]) * 4;
    const minuteOffset = appt.minute / 15;
    return (hourOffset + minuteOffset) * this.SLOT_HEIGHT + this.SLOT_HEIGHT; // +SLOT_HEIGHT for top spacer
  }

  getHeightPx(appt: Appointment): number {
    return Math.max((appt.duration || 30) / 15 * this.SLOT_HEIGHT, this.SLOT_HEIGHT);
  }

  getType(type: string) { return APPOINTMENT_TYPES.find(t => t.value === type); }
  getStatus(status: string) { return APPOINTMENT_STATUSES.find(s => s.value === status); }

  getDurationLabel(duration: number) {
    if (!duration) return '';
    if (duration < 60) return duration + ' min';
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }

  formattedDate() {
    if (!this.selectedDate) return '';
    const [y, mo, d] = this.selectedDate.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatTime(hour: number, minute: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  confirmRemoveDoctor(id: string, name: string) { this.removeConfirm.set({ id, name }); }

  onRemoveDoctor() {
    const confirm = this.removeConfirm();
    if (!confirm) return;
    this.apptDeletedForDoctor.emit(confirm.id);
    this.docSvc.remove(confirm.id);
    this.removeConfirm.set(null);
  }

  onAddDoctor(data: { name: string; specialty: string }) { this.docSvc.add(data.name, data.specialty); }

  goToday() {
    this.dateChanged.emit(this.toDateStr(new Date()));
  }

  printSchedule() {
    const appts = [...this._appointments()]
      .sort((a, b) => a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute);

    const doc = this.docSvc.getAll()();
    const dateStr = this.formattedDate();

    const rows = appts.map(a => {
      const type = this.getType(a.type);
      const status = this.getStatus(a.status);
      const doctor = doc.find(d => d.id === a.doctorId)?.name || '';
      const time = this.formatTime(a.hour, a.minute);
      const dur = this.getDurationLabel(a.duration);
      return `<tr>
        <td>${time}</td>
        <td>${dur}</td>
        <td><strong>${a.patientName}</strong></td>
        <td>${a.phone || '—'}</td>
        <td>${doctor}</td>
        <td>${type?.label || ''}</td>
        <td>${status?.label || ''}</td>
        <td>${a.notes || ''}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Schedule — ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ccc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Daily Schedule</h1>
  <div class="subtitle">${dateStr} &nbsp;·&nbsp; ${appts.length} appointment${appts.length !== 1 ? 's' : ''}</div>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Duration</th>
        <th>Patient</th>
        <th>Phone</th>
        <th>Doctor</th>
        <th>Type</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  prevDay() {
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    this.dateChanged.emit(this.toDateStr(new Date(y, m - 1, d - 1)));
  }

  nextDay() {
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    this.dateChanged.emit(this.toDateStr(new Date(y, m - 1, d + 1)));
  }

  toDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}