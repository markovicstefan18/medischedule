import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <nav class="ms-navbar">
      <div class="ms-navbar-inner">
        <div class="ms-navbar-brand">
          <img src="/kenko-logo.png" alt="Kenko logo" style="height:32px;width:32px;object-fit:contain;border-radius:8px">
          <span class="ms-brand-text">Kenko</span>
        </div>
        <div class="ms-navbar-right">
          <!-- Search -->
          <button class="ms-icon-btn" (click)="search.emit()" title="Search patients">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <!-- Theme toggle -->
          <button class="ms-icon-btn" (click)="themeSvc.toggle()" [title]="themeSvc.theme() === 'dark' ? 'Light mode' : 'Dark mode'">
            @if (themeSvc.theme() === 'dark') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            }
          </button>
          <!-- Notifications -->
          <button class="ms-icon-btn ms-notif-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="ms-notif-dot"></span>
          </button>
          <!-- Sign in -->
          <button class="ms-login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Sign in
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .ms-navbar { background: var(--soig-surface); border-bottom: 1px solid var(--soig-border); position: sticky; top: 0; z-index: 100; }
    .ms-navbar-inner { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; height: 56px; display: flex; align-items: center; justify-content: space-between; }
    .ms-navbar-brand { display: flex; align-items: center; gap: 10px; }
    .ms-brand-text { font-size: 15px; font-weight: 600; color: var(--soig-ink); }
    .ms-navbar-right { display: flex; align-items: center; gap: 6px; }
    .ms-icon-btn { background: none; border: none; cursor: pointer; color: var(--soig-ink-2); padding: 7px; border-radius: 6px; display: flex; align-items: center; justify-content: center; position: relative; }
    .ms-icon-btn:hover { background: var(--soig-surface-2); color: var(--soig-ink); }
    .ms-notif-btn { position: relative; }
    .ms-notif-dot { position: absolute; top: 4px; right: 4px; width: 7px; height: 7px; border-radius: 50%; background: #C21016; border: 1.5px solid var(--soig-surface); }
    .ms-login-btn { background: none; border: 1px solid var(--soig-border-2); border-radius: 6px; padding: 6px 14px; font-size: 13px; color: var(--soig-ink-2); cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; margin-left: 4px; }
    .ms-login-btn:hover { background: var(--soig-surface-2); color: var(--soig-ink); }
  `]
})
export class NavbarComponent {
  themeSvc = inject(ThemeService);
  searchOpen = signal(false);
  @Output() search = new EventEmitter<void>();
}