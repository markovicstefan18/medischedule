import { Component, Input, Output, EventEmitter, computed, signal, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-calendar',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  template: `
    <div class="ms-cal">
      <div class="ms-cal-header">
        <span class="ms-cal-title">{{ monthName() }} {{ year() }}</span>
        <div class="ms-cal-nav">
          <button (click)="prevMonth()">‹</button>
          <button (click)="nextMonth()">›</button>
        </div>
      </div>
      <div class="ms-cal-grid">
        @for (d of dayNames; track d) {
          <div class="ms-cal-dn">{{ d }}</div>
        }
        @for (day of calDays(); track day.key) {
          <div class="ms-cal-day"
            [class.other]="!day.current"
            [class.today]="day.isToday"
            [class.selected]="day.dateStr === selectedDate"
            [class.has-appt]="datesWithAppts.has(day.dateStr)"
            (click)="day.current && selectDate(day.dateStr)">
            {{ day.n }}
          </div>
        }
      </div>

      <!-- Legend -->
      <div class="ms-legend">
        <div class="ms-legend-title">Appointment types</div>
        <div class="ms-legend-items">
          @for (t of types; track t.value) {
            <div class="ms-legend-item">
              <span class="ms-legend-dot" [style.background]="t.border"></span>
              {{ t.label }}
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ms-cal { padding: 16px; }
    .ms-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .ms-cal-title { font-size: 13px; font-weight: 600; color: var(--soig-ink); }
    .ms-cal-nav { display: flex; gap: 2px; }
    .ms-cal-nav button { background: none; border: none; cursor: pointer; color: var(--soig-ink-2); padding: 3px 8px; border-radius: 4px; font-size: 16px; }
    .ms-cal-nav button:hover { background: var(--soig-surface-2); }
    .ms-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .ms-cal-dn { font-size: 10px; color: var(--soig-ink-3); text-align: center; padding: 3px 0; }
    .ms-cal-day { font-size: 12px; text-align: center; padding: 5px 2px; border-radius: 50%; cursor: pointer; color: var(--soig-ink-2); line-height: 1; transition: background 0.1s; }
    .ms-cal-day:hover { background: var(--soig-surface-2); }
    .ms-cal-day.today { background: #0072D1; color: #fff; }
    .ms-cal-day.selected:not(.today) { background: #B5D4F4; color: #0C447C; }
    .ms-cal-day.has-appt { font-weight: 600; color: var(--soig-ink); }
    .ms-cal-day.other { color: var(--soig-ink-3); opacity: 0.4; cursor: default; }
    .ms-cal-day.other:hover { background: none; }
    .ms-legend { margin-top: 20px; border-top: 1px solid var(--soig-border); padding-top: 16px; }
    .ms-legend-title { font-size: 10px; font-weight: 600; color: var(--soig-ink-3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .ms-legend-items { display: flex; flex-wrap: wrap; gap: 6px 12px; }
    .ms-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--soig-ink-2); }
    .ms-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  `]
})
export class CalendarComponent implements OnChanges {
  @Input() selectedDate = '';
  @Input() datesWithAppts = new Set<string>();
  @Output() dateSelected = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDate'] && this.selectedDate) {
      const [y, m] = this.selectedDate.split('-').map(Number);
      const current = this.viewDate();
      if (current.getFullYear() !== y || current.getMonth() !== m - 1) {
        this.viewDate.set(new Date(y, m - 1, 1));
      }
    }
  }

  dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  types = [
    { value: 'checkup',     label: 'Check-up',    border: '#185FA5' },
    { value: 'preventive',  label: 'Preventive',  border: '#3B6D11' },
    { value: 'diagnostic',  label: 'Diagnostic',  border: '#854F0B' },
    { value: 'emergency',   label: 'Emergency',   border: '#A32D2D' },
    { value: 'restorative', label: 'Restorative', border: '#534AB7' },
  ];

  private viewDate = signal(new Date());

  monthName = computed(() => this.viewDate().toLocaleString('default', { month: 'long' }));
  year = computed(() => this.viewDate().getFullYear());

  calDays = computed(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date().toISOString().split('T')[0];

    // Monday-first offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const dd = new Date(year, month, -i);
      days.push({ n: dd.getDate(), current: false, isToday: false, dateStr: dd.toISOString().split('T')[0], key: 'p' + i });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ n: i, current: true, isToday: dateStr === today, dateStr, key: 'c' + i });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const dd = new Date(year, month + 1, i);
      days.push({ n: dd.getDate(), current: false, isToday: false, dateStr: dd.toISOString().split('T')[0], key: 'n' + i });
    }
    return days;
  });

  prevMonth() {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDate(dateStr: string) {
    this.dateSelected.emit(dateStr);
  }
}