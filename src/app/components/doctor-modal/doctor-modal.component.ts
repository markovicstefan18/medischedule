import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doctor-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dm-overlay" (click)="onOverlayClick($event)">
      <div class="dm-modal">
        <div class="dm-header">
          <h2 class="dm-title">Add doctor</h2>
          <button class="dm-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="dm-body">
          <div class="dm-field">
            <label class="dm-label">Full name *</label>
            <input class="dm-input" [(ngModel)]="name" placeholder="Dr. John Smith" (keyup.enter)="onSave()">
          </div>
          <div class="dm-field">
            <label class="dm-label">Specialty</label>
            <input class="dm-input" [(ngModel)]="specialty" placeholder="e.g. General, Dentist, Cardiology" (keyup.enter)="onSave()">
          </div>
        </div>
        <div class="dm-footer">
          <button class="dm-btn dm-btn-secondary" (click)="closed.emit()">Cancel</button>
          <button class="dm-btn dm-btn-primary" (click)="onSave()" [disabled]="!name.trim()">Add doctor</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .dm-modal { background: var(--soig-surface); border-radius: 12px; border: 1px solid var(--soig-border); width: 100%; max-width: 380px; }
    .dm-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--soig-border); }
    .dm-title { font-size: 15px; font-weight: 600; color: var(--soig-ink); }
    .dm-close { background: none; border: none; cursor: pointer; color: var(--soig-ink-3); padding: 4px; border-radius: 4px; display: flex; }
    .dm-close:hover { background: var(--soig-surface-2); }
    .dm-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
    .dm-field { display: flex; flex-direction: column; gap: 5px; }
    .dm-label { font-size: 12px; font-weight: 500; color: var(--soig-ink-2); }
    .dm-input { border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--soig-ink); background: var(--soig-surface); font-family: inherit; width: 100%; }
    .dm-input:focus { outline: none; border-color: #0072D1; }
    .dm-footer { padding: 12px 20px; border-top: 1px solid var(--soig-border); display: flex; justify-content: flex-end; gap: 8px; }
    .dm-btn { border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: inherit; border: 1px solid transparent; }
    .dm-btn-primary { background: #0072D1; color: #fff; border-color: #0072D1; }
    .dm-btn-primary:hover { background: #004E8C; }
    .dm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .dm-btn-secondary { background: var(--soig-surface); color: var(--soig-ink-2); border-color: var(--soig-border-2); }
    .dm-btn-secondary:hover { background: var(--soig-surface-2); }
  `]
})
export class DoctorModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ name: string; specialty: string }>();

  name = '';
  specialty = '';

  onSave() {
    if (!this.name.trim()) return;
    this.saved.emit({ name: this.name.trim(), specialty: this.specialty.trim() });
    this.closed.emit();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('dm-overlay')) this.closed.emit();
  }
}