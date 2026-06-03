import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, HOURS } from '../../models/appointment.model';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
interface WeekDay { date: string; dayName: string; dayNum: number; monthShort: string; isToday: boolean; }
@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="wv-wrap">
      <div class="wv-header">
        <div class="wv-header-left">
          <button class="wv-nav-btn" (click)="prevWeek()">‹ Prev</button>
          <button class="wv-nav-btn wv-today-btn" (click)="goToday()">Today</button>
          <button class="wv-nav-btn" (click)="nextWeek()">Next ›</button>
          <span class="wv-range">{{ weekRange() }}</span>
        </div>
        <div class="wv-header-right">
          <select class="wv-doctor-select" [(ngModel)]="selectedDoctorId">
            @for (doc of docSvc.getAll()(); track doc.id) {
              <option [value]="doc.id">{{ doc.name }}</option>
            }
          </select>
          <button class="wv-add-btn" (click)="newAppt.emit({ hour: 9, minute: 0, doctorId: selectedDoctorId })">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New appointment
          </button>
        </div>
      </div>

      <!-- Single scroll container; headers + time column pinned via sticky -->
      <div class="wv-schedule">
        <div class="wv-grid">
          <!-- Top-left corner (pinned both directions) -->
          <div class="wv-corner"></div>

          <!-- Day headers (pinned to top) -->
          @for (day of weekDays(); track day.date) {
            <div class="wv-day-header" [class.today]="day.isToday" (click)="dayClicked.emit(day.date)">
              <div class="wv-day-name">{{ day.dayName }}</div>
              <div class="wv-day-num">{{ day.dayNum }}</div>
              <div class="wv-day-count">{{ getDayAppts(day.date).length || '' }}</div>
            </div>
          }

          <!-- Time column (pinned to left, scrolls vertically with rows) -->
          <div class="wv-time-col">
            <div class="wv-slot-spacer"></div>
            @for (slot of timeSlots; track slot.hour + ':' + slot.minute) {
              <div class="wv-time-cell" [class.hour-start]="slot.isHourStart">
                @if (slot.isHourStart) {
                  <span class="wv-time-label">{{ slot.label }}</span>
                }
              </div>
            }
          </div>

          <!-- Day columns -->
          @for (day of weekDays(); track day.date; let isLast = $last) {
            <div class="wv-col-grid">
              <div class="wv-col-spacer"></div>
              @for (slot of timeSlots; track slot.hour + ':' + slot.minute) {
                <div class="wv-grid-cell" [class.hour-start]="slot.isHourStart"
                  (click)="newAppt.emit({ hour: slot.hour, minute: slot.minute, doctorId: selectedDoctorId, date: day.date })">
                </div>
              }
              @for (appt of getDayAppts(day.date); track appt.id) {
                <div class="wv-appt" [class.tip-left]="isLast"
                  [style.top.px]="getTopPx(appt)"
                  [style.height.px]="getHeightPx(appt)"
                  [style.background]="getType(appt.type)?.bg"
                  [style.border-left-color]="getType(appt.type)?.border"
                  (click)="apptClicked.emit(appt); $event.stopPropagation()">
                  <div class="wv-appt-name">{{ appt.patientName }}</div>
                  <div class="wv-appt-time">{{ formatTime(appt.hour, appt.minute) }}</div>
                  <div class="wv-appt-tooltip">
                    <div class="wv-tt-name">{{ appt.patientName }}</div>
                    <div class="wv-tt-row"><span class="wv-tt-label">Time</span><span>{{ formatTime(appt.hour, appt.minute) }}</span></div>
                    <div class="wv-tt-row"><span class="wv-tt-label">Type</span><span [style.color]="getType(appt.type)?.color">{{ getType(appt.type)?.label }}</span></div>
                    @if (appt.phone) {<div class="wv-tt-row"><span class="wv-tt-label">Phone</span><span>{{ appt.phone }}</span></div>}
                    @if (appt.notes) {<div class="wv-tt-notes">{{ appt.notes }}</div>}
                  </div>
                </div>
              }
              @if (day.isToday && currentTimeTop() !== null) {
                <div class="wv-current-time" [style.top.px]="currentTimeTop()!">
                  <div class="wv-current-dot"></div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host *, :host *::before, :host *::after { box-sizing: border-box; }
    :host { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .wv-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .wv-header { padding: 10px 16px; border-bottom: 1px solid var(--soig-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; flex-shrink: 0; }
    .wv-header-left { display: flex; align-items: center; gap: 6px; }
    .wv-header-right { display: flex; align-items: center; gap: 8px; }
    .wv-range { font-size: 13px; font-weight: 500; color: var(--soig-ink); margin-left: 4px; }
    .wv-nav-btn { background: none; border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 5px 10px; font-size: 12px; cursor: pointer; color: var(--soig-ink-2); font-family: inherit; }
    .wv-nav-btn:hover { background: var(--soig-surface-2); }
    .wv-today-btn { color: #0072D1; border-color: #0072D1; }
    .wv-doctor-select { border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 6px 10px; font-size: 13px; color: var(--soig-ink); background: var(--soig-surface); font-family: inherit; cursor: pointer; }
    .wv-add-btn { background: #0072D1; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 5px; }
    .wv-add-btn:hover { background: #004E8C; }

    /* The one scroll container for both axes */
    .wv-schedule { flex: 1; overflow: auto; }
    .wv-grid {
      display: grid;
      grid-template-columns: 56px repeat(7, minmax(120px, 1fr));
      grid-template-rows: 52px auto;
      min-width: max-content;
    }

    /* Pinned corner (top + left) */
    .wv-corner {
      position: sticky; top: 0; left: 0; z-index: 12;
      background: var(--soig-surface);
      border-right: 1px solid var(--soig-border);
      border-bottom: 1px solid var(--soig-border);
    }

    /* Day headers pinned to top */
    .wv-day-header {
      position: sticky; top: 0; z-index: 9;
      height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      border-bottom: 1px solid var(--soig-border); border-right: 1px solid var(--soig-border);
      background: var(--soig-surface-2); cursor: pointer;
    }
    .wv-day-header:hover { background: var(--soig-surface-3); }
    .wv-day-header.today { background: #E6F1FB; }
    .wv-day-name { font-size: 10px; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.4px; }
    .wv-day-num { font-size: 18px; font-weight: 600; color: var(--soig-ink); line-height: 1.2; }
    .wv-day-header.today .wv-day-num { color: #0072D1; }
    .wv-day-count { font-size: 10px; color: var(--soig-ink-3); height: 12px; }

    /* Time column pinned to left, scrolls vertically with the rows */
    .wv-time-col {
      position: sticky; left: 0; z-index: 10;
      background: var(--soig-surface);
      border-right: 1px solid var(--soig-border);
      display: flex; flex-direction: column;
    }
    .wv-slot-spacer { height: 20px; }
    .wv-time-cell { height: 20px; display: flex; align-items: flex-start; justify-content: flex-end; padding-right: 6px; }
    .wv-time-cell.hour-start { border-top: 1px solid var(--soig-border); }
    .wv-time-label { font-size: 11px; font-weight: 500; color: var(--soig-ink-2); margin-top: -9px; display: flex; align-items: center; justify-content: center; width: 44px; height: 20px; border-radius: 10px; background: var(--ms-hour-bg, #fff); }

    /* Day columns */
    .wv-col-grid { position: relative; border-right: 1px solid var(--soig-border); overflow: visible; }
    .wv-col-grid:last-child { border-right: none; }
    .wv-col-spacer { height: 20px; }
    .wv-grid-cell { height: 20px; cursor: pointer; }
    .wv-grid-cell.hour-start { border-top: 1px solid var(--soig-border); }
    .wv-grid-cell:not(.hour-start) { border-top: 1px dashed var(--soig-border); }
    .wv-grid-cell:hover { background: var(--soig-surface-2); }

    .wv-appt { position: absolute; left: 2px; right: 2px; border-left: 3px solid; border-radius: 0 4px 4px 0; padding: 2px 5px; cursor: pointer; overflow: hidden; z-index: 2; min-height: 20px; transition: opacity 0.1s; }
    .wv-appt:hover { opacity: 0.85; z-index: 999; overflow: visible; }
    .wv-appt-tooltip { display: none; position: absolute; left: calc(100% + 6px); top: 0; width: 180px; background: var(--soig-surface); border: 1px solid var(--soig-border-2); border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; pointer-events: none; }
    .wv-appt:hover .wv-appt-tooltip { display: block; }
    .wv-appt.tip-left .wv-appt-tooltip { left: auto; right: calc(100% + 6px); }
    .wv-tt-name { font-size: 12px; font-weight: 600; color: var(--soig-ink); margin-bottom: 5px; }
    .wv-tt-row { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; color: var(--soig-ink-2); padding: 1px 0; }
    .wv-tt-label { color: var(--soig-ink-3); flex-shrink: 0; }
    .wv-tt-notes { font-size: 11px; color: var(--soig-ink-2); margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--soig-border); line-height: 1.5; }
    .wv-appt-name { font-size: 11px; font-weight: 600; color: var(--soig-appt-name, #1B2A3B); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wv-appt-time { font-size: 10px; color: var(--soig-appt-meta, #4A5568); }
    .wv-current-time { position: absolute; left: 0; right: 0; height: 2px; background: #E24B4A; z-index: 5; pointer-events: none; }
    .wv-current-dot { position: absolute; left: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #E24B4A; }
  `]
})
export class WeekViewComponent implements OnInit, OnDestroy {
  private _selectedDate = signal('');
  @Input() set selectedDate(val: string) { this._selectedDate.set(val); }
  get selectedDate() { return this._selectedDate(); }
  @Output() dateChanged = new EventEmitter<string>();
  @Output() dayClicked = new EventEmitter<string>();
  @Output() apptClicked = new EventEmitter<Appointment>();
  @Output() newAppt = new EventEmitter<{ hour: number; minute: number; doctorId: string; date?: string }>();
  docSvc = inject(DoctorService);
  private svc = inject(AppointmentService);
  selectedDoctorId = '';
  currentTimeTop = signal<number | null>(null);
  private timeInterval: any = null;
  readonly SLOT_HEIGHT = 20;
  timeSlots = this.buildSlots();
  ngOnInit() {
    this.selectedDoctorId = this.docSvc.getAll()()[0]?.id || '';
    this.updateCurrentTime();
    this.timeInterval = setInterval(() => this.updateCurrentTime(), 60000);
  }
  ngOnDestroy() { if (this.timeInterval) clearInterval(this.timeInterval); }
  updateCurrentTime() {
    const now = new Date();
    const h = now.getHours(); const m = now.getMinutes();
    if (h < HOURS[0] || h > HOURS[HOURS.length - 1]) { this.currentTimeTop.set(null); return; }
    this.currentTimeTop.set((h - HOURS[0]) * 4 * this.SLOT_HEIGHT + (m / 15) * this.SLOT_HEIGHT + this.SLOT_HEIGHT);
  }
  weekDays = computed(() => {
    const [y, mo, d] = this._selectedDate().split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const dow = date.getDay();
    const monday = new Date(y, mo - 1, d - (dow === 0 ? 6 : dow - 1));
    const today = this.toDateStr(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      return {
        date: this.toDateStr(dd),
        dayName: dd.toLocaleString('default', { weekday: 'short' }),
        dayNum: dd.getDate(),
        monthShort: dd.toLocaleString('default', { month: 'short' }),
        isToday: this.toDateStr(dd) === today,
      };
    });
  });
  weekRange = computed(() => {
    const days = this.weekDays();
    if (!days.length) return '';
    const first = days[0]; const last = days[6];
    const firstDate = new Date(first.date + 'T00:00:00');
    const lastDate = new Date(last.date + 'T00:00:00');
    const f = firstDate.toLocaleString('default', { month: 'short', day: 'numeric' });
    const l = lastDate.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${f} – ${l}`;
  });
  getDayAppts(date: string) {
    return this.svc.getAll().filter(a => a.date === date && a.doctorId === this.selectedDoctorId);
  }
  buildSlots() {
    const slots: any[] = [];
    for (const h of HOURS) {
      for (const m of [0, 15, 30, 45]) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h > 12 ? h - 12 : h;
        slots.push({ hour: h, minute: m, isHourStart: m === 0, label: `${hour} ${ampm}` });
      }
    }
    return slots;
  }
  getTopPx(appt: Appointment): number {
    return (appt.hour - HOURS[0]) * 4 * this.SLOT_HEIGHT + (appt.minute / 15) * this.SLOT_HEIGHT + this.SLOT_HEIGHT;
  }
  getHeightPx(appt: Appointment): number {
    return Math.max((appt.duration || 30) / 15 * this.SLOT_HEIGHT, this.SLOT_HEIGHT);
  }
  getType(type: string) { return APPOINTMENT_TYPES.find(t => t.value === type); }
  formatTime(hour: number, minute: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }
  prevWeek() {
    const [y, m, d] = this._selectedDate().split('-').map(Number);
    this.dateChanged.emit(this.toDateStr(new Date(y, m - 1, d - 7)));
  }
  nextWeek() {
    const [y, m, d] = this._selectedDate().split('-').map(Number);
    this.dateChanged.emit(this.toDateStr(new Date(y, m - 1, d + 7)));
  }
  goToday() { this.dateChanged.emit(this.toDateStr(new Date())); }
  toDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}