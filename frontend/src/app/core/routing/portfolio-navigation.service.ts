import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SupportedLocale } from '../i18n/locales';
import { MotionPreferenceService } from '../motion/motion-preference.service';
import { localizedPortfolioSectionUrl, StaticPageId } from './localized-routes';

export type PortfolioScrollMode = 'explicit' | 'instant';

@Injectable({
  providedIn: 'root',
})
export class PortfolioNavigationService {
  readonly #activeSection = signal<StaticPageId | null>(null);
  readonly #document = inject(DOCUMENT);
  readonly #motionPreference = inject(MotionPreferenceService);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #router = inject(Router);

  readonly activeSection = this.#activeSection.asReadonly();

  sectionHref(locale: SupportedLocale, sectionId: StaticPageId): string {
    return localizedPortfolioSectionUrl(locale, sectionId);
  }

  isActive(sectionId: StaticPageId): boolean {
    return this.activeSection() === sectionId;
  }

  setActiveSection(sectionId: StaticPageId | null): void {
    this.#activeSection.set(sectionId);
  }

  navigateToSection(event: MouseEvent, locale: SupportedLocale, sectionId: StaticPageId): boolean {
    if (!isPlainPrimaryClick(event) || !isPlatformBrowser(this.#platformId)) {
      return false;
    }

    event.preventDefault();
    this.setActiveSection(sectionId);

    const destination = this.sectionHref(locale, sectionId);
    const shouldMoveFocus = event.detail === 0;

    void this.#router.navigateByUrl(destination).then(() => {
      this.scrollToSection(sectionId, 'explicit', shouldMoveFocus);
    });

    return true;
  }

  scrollToSection(sectionId: StaticPageId, mode: PortfolioScrollMode, moveFocus = false): boolean {
    if (!isPlatformBrowser(this.#platformId)) {
      return false;
    }

    const target = this.#document.getElementById(sectionId);

    if (!target) {
      return false;
    }

    const behavior =
      mode === 'explicit' && !this.#motionPreference.prefersReducedMotion() ? 'smooth' : 'instant';

    target.scrollIntoView?.({
      behavior: behavior as ScrollBehavior,
      block: 'start',
    });

    if (moveFocus) {
      target.focus({ preventScroll: true });
    }

    return true;
  }
}

function isPlainPrimaryClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
