import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export const reducedMotionMediaQuery = '(prefers-reduced-motion: reduce)';

@Injectable({
  providedIn: 'root',
})
export class MotionPreferenceService {
  readonly #destroyRef = inject(DestroyRef);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #prefersReducedMotion = signal(false);

  readonly prefersReducedMotion = this.#prefersReducedMotion.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.#platformId) || typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia(reducedMotionMediaQuery);
    const listener = (event: MediaQueryListEvent): void => {
      this.#prefersReducedMotion.set(event.matches);
    };

    this.#prefersReducedMotion.set(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);
    this.#destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
  }
}
