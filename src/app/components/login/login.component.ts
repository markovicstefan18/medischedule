import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ms-login-wrap">
      <div class="ms-login-card">
        <div class="ms-login-brand">
          <img src="/kenko-logo.png" alt="Kenko" style="height:40px;width:40px;object-fit:contain;border-radius:10px">
          <span>Kenko</span>
        </div>
        <p class="ms-login-sub">{{ mode() === 'signin' ? 'Sign in to your schedule' : 'Create your account' }}</p>

        <button class="ms-google-btn" (click)="google()" [disabled]="busy()">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 5.1 29.4 3 24 3 16 3 9.1 7.6 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.6 26.7 36.5 24 36.5c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.1 40.3 16 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C39.3 41.6 45 37 45 24c0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div class="ms-divider"><span>or</span></div>

        <input class="ms-input" type="email" placeholder="Email" [(ngModel)]="email" autocomplete="email" />
        <input class="ms-input" type="password" placeholder="Password"
               [(ngModel)]="password" autocomplete="current-password" />

        @if (error()) { <p class="ms-error">{{ error() }}</p> }

        <button class="ms-submit-btn" (click)="submit()" [disabled]="busy()">
          {{ busy() ? 'Please wait…' : (mode() === 'signin' ? 'Sign in' : 'Create account') }}
        </button>

        <p class="ms-toggle">
          {{ mode() === 'signin' ? "No account?" : 'Already have an account?' }}
          <button (click)="toggleMode()">{{ mode() === 'signin' ? 'Register' : 'Sign in' }}</button>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .ms-login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--soig-surface-2); padding: 1rem; }
    .ms-login-card { background: var(--soig-surface); border: 1px solid var(--soig-border); border-radius: 12px; padding: 32px; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .ms-login-brand { display: flex; align-items: center; gap: 10px; justify-content: center; font-size: 20px; font-weight: 600; color: var(--soig-ink); }
    .ms-login-sub { text-align: center; color: var(--soig-ink-2); margin: 0 0 8px; font-size: 14px; }
    .ms-google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--soig-surface); border: 1px solid var(--soig-border-2); border-radius: 8px; padding: 10px; font-size: 14px; font-weight: 500; color: var(--soig-ink); cursor: pointer; font-family: inherit; }
    .ms-google-btn:hover:not(:disabled) { background: var(--soig-surface-2); }
    .ms-google-btn:disabled, .ms-submit-btn:disabled { opacity: 0.6; cursor: default; }
    .ms-divider { display: flex; align-items: center; gap: 10px; color: var(--soig-ink-3); font-size: 12px; }
    .ms-divider::before, .ms-divider::after { content: ''; flex: 1; height: 1px; background: var(--soig-border); }
    .ms-input { padding: 10px 12px; border: 1px solid var(--soig-border-2); border-radius: 8px; font-size: 14px; font-family: inherit; background: var(--soig-surface); color: var(--soig-ink); }
    .ms-input:focus { outline: none; border-color: var(--soig-accent); }
    .ms-submit-btn { background: var(--soig-accent); color: #fff; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .ms-error { color: #C21016; font-size: 13px; margin: 0; text-align: center; }
    .ms-toggle { text-align: center; font-size: 13px; color: var(--soig-ink-2); margin: 4px 0 0; }
    .ms-toggle button { background: none; border: none; color: var(--soig-accent); cursor: pointer; font-size: 13px; font-family: inherit; padding: 0; font-weight: 600; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);

  mode = signal<'signin' | 'register'>('signin');
  email = '';
  password = '';
  busy = signal(false);
  error = signal('');

  toggleMode() {
    this.mode.set(this.mode() === 'signin' ? 'register' : 'signin');
    this.error.set('');
  }

  async google() {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.signInWithGoogle();
    } catch (e) {
      this.error.set(this.friendly(e));
    } finally {
      this.busy.set(false);
    }
  }

  async submit() {
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      if (this.mode() === 'signin') {
        await this.auth.signInWithEmail(this.email, this.password);
      } else {
        await this.auth.registerWithEmail(this.email, this.password);
      }
    } catch (e) {
      this.error.set(this.friendly(e));
    } finally {
      this.busy.set(false);
    }
  }

  // Map common Firebase auth error codes to readable messages.
  private friendly(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/invalid-email': return 'That email address looks invalid.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Incorrect email or password.';
      case 'auth/email-already-in-use': return 'An account with that email already exists.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/popup-closed-by-user': return 'Sign-in was cancelled.';
      case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
      default: return 'Something went wrong. Please try again.';
    }
  }
}