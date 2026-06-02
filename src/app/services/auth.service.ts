import { Injectable, inject, computed, Injector, runInInjectionContext } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth, authState, signInWithPopup, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private injector = inject(Injector);

  // undefined -> loading, null -> signed out, User -> signed in
  readonly user = toSignal(authState(this.auth));

  readonly isLoggedIn = computed(() => !!this.user());
  readonly uid = computed(() => this.user()?.uid ?? null);
  readonly displayName = computed(
    () => this.user()?.displayName || this.user()?.email || ''
  );

  signInWithGoogle(): Promise<unknown> {
    return runInInjectionContext(this.injector, () =>
      signInWithPopup(this.auth, new GoogleAuthProvider())
    );
  }

  signInWithEmail(email: string, password: string): Promise<unknown> {
    return runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, password)
    );
  }

  registerWithEmail(email: string, password: string): Promise<unknown> {
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  logout(): Promise<void> {
    return runInInjectionContext(this.injector, () => signOut(this.auth));
  }
}