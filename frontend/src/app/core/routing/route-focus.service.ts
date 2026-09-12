import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { portfolioSectionFromUrl } from './localized-routes';

@Injectable({
  providedIn: 'root',
})
export class RouteFocusService {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #router = inject(Router);
  #initialized = false;
  #previousPath?: string;

  initialize(): void {
    if (this.#initialized || !isPlatformBrowser(this.#platformId)) {
      return;
    }

    this.#initialized = true;
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((event) => this.#handleNavigationEnd(event));
  }

  #handleNavigationEnd(event: NavigationEnd): void {
    const nextPath = routePath(event.urlAfterRedirects);

    if (this.#previousPath === undefined) {
      this.#previousPath = nextPath;
      return;
    }

    if (this.#previousPath === nextPath) {
      return;
    }

    this.#previousPath = nextPath;

    afterNextRender(
      () => {
        if (routePath(this.#router.url) !== nextPath) {
          return;
        }

        this.#routeFocusTarget(event.urlAfterRedirects)?.focus();
      },
      { injector: this.#injector },
    );
  }

  #routeFocusTarget(url: string): HTMLElement | null {
    const sectionId = portfolioSectionFromUrl(url);

    if (sectionId) {
      return this.#document.getElementById(sectionId);
    }

    return (
      this.#document.querySelector<HTMLElement>('[data-route-focus-target]') ??
      this.#document.querySelector<HTMLElement>('main#main-content')
    );
  }
}

function routePath(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? '';
}
