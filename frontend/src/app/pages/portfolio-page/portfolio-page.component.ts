import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import {
  portfolioSectionFromUrl,
  portfolioSectionIds,
  StaticPageId,
} from '../../core/routing/localized-routes';
import { ContactPageComponent } from '../contact-page/contact-page.component';
import { EducationPageComponent } from '../education-page/education-page.component';
import { ExperiencePageComponent } from '../experience-page/experience-page.component';
import { GitHubActivityComponent } from '../home-page/github-activity.component';
import { HomePageComponent } from '../home-page/home-page.component';
import { ProjectsPageComponent } from '../projects-page/projects-page.component';

export const portfolioScrollSpyRootMargin = '-42% 0px -42% 0px';

@Component({
  selector: 'app-portfolio-page',
  imports: [
    ContactPageComponent,
    EducationPageComponent,
    ExperiencePageComponent,
    HomePageComponent,
    GitHubActivityComponent,
    ProjectsPageComponent,
  ],
  templateUrl: './portfolio-page.component.html',
  styleUrl: './portfolio-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPageComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #navigation = inject(PortfolioNavigationService);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #router = inject(Router);
  readonly #visibleSections = new Map<StaticPageId, IntersectionObserverEntry>();
  #fragmentFirstFrame?: number;
  #historyNavigationFrame?: number;
  #fragmentLoadListener?: () => void;
  #fragmentSecondFrame?: number;

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const metadata = inject(PageMetadataService);
    const locale = toSupportedLocale(route.parent?.snapshot.data['locale']) ?? defaultLocale;

    localeContext.setLocale(locale);
    metadata.applyStaticPage('home', locale);
    this.#navigation.setActiveSection('home');

    if (isPlatformBrowser(this.#platformId)) {
      this.#destroyRef.onDestroy(() => this.#cancelFragmentScroll());
      afterNextRender(() => this.#initializeSectionNavigation(), { injector: this.#injector });
    }
  }

  #initializeSectionNavigation(): void {
    const fragmentSection =
      portfolioSectionFromUrl(this.#router.url) ??
      portfolioSectionFromUrl(globalThis.location.href);

    if (fragmentSection) {
      this.#navigation.setActiveSection(fragmentSection);
      this.#navigation.scrollToSection(fragmentSection, 'instant');
      this.#scheduleFinalFragmentScroll(fragmentSection);
    }

    globalThis.addEventListener('popstate', this.#handleHistoryNavigation);
    this.#destroyRef.onDestroy(() =>
      globalThis.removeEventListener('popstate', this.#handleHistoryNavigation),
    );

    if (typeof globalThis.IntersectionObserver !== 'function') {
      return;
    }

    const observer = new globalThis.IntersectionObserver(
      (entries) => this.#handleSectionIntersections(entries),
      {
        rootMargin: portfolioScrollSpyRootMargin,
        threshold: 0,
      },
    );

    for (const sectionId of portfolioSectionIds) {
      const section = this.#document.getElementById(sectionId);

      if (section) {
        observer.observe(section);
      }
    }

    this.#destroyRef.onDestroy(() => observer.disconnect());
  }

  #scheduleFinalFragmentScroll(sectionId: StaticPageId): void {
    const scrollAfterBrowserRestoration = (): void => {
      this.#fragmentLoadListener = undefined;
      this.#fragmentFirstFrame = globalThis.requestAnimationFrame(() => {
        this.#fragmentFirstFrame = undefined;
        this.#fragmentSecondFrame = globalThis.requestAnimationFrame(() => {
          this.#fragmentSecondFrame = undefined;

          if (portfolioSectionFromUrl(globalThis.location.href) === sectionId) {
            this.#navigation.setActiveSection(sectionId);
            this.#navigation.scrollToSection(sectionId, 'instant');
          }
        });
      });
    };

    if (this.#document.readyState === 'complete') {
      scrollAfterBrowserRestoration();
      return;
    }

    this.#fragmentLoadListener = scrollAfterBrowserRestoration;
    globalThis.addEventListener('load', this.#fragmentLoadListener, { once: true });
  }

  #cancelFragmentScroll(): void {
    if (this.#fragmentLoadListener) {
      globalThis.removeEventListener('load', this.#fragmentLoadListener);
      this.#fragmentLoadListener = undefined;
    }

    if (this.#fragmentFirstFrame !== undefined) {
      globalThis.cancelAnimationFrame(this.#fragmentFirstFrame);
      this.#fragmentFirstFrame = undefined;
    }

    if (this.#fragmentSecondFrame !== undefined) {
      globalThis.cancelAnimationFrame(this.#fragmentSecondFrame);
      this.#fragmentSecondFrame = undefined;
    }

    if (this.#historyNavigationFrame !== undefined) {
      globalThis.cancelAnimationFrame(this.#historyNavigationFrame);
      this.#historyNavigationFrame = undefined;
    }
  }

  readonly #handleHistoryNavigation = (): void => {
    const sectionId = portfolioSectionFromUrl(globalThis.location.href) ?? 'home';

    this.#navigation.setActiveSection(sectionId);
    this.#historyNavigationFrame = globalThis.requestAnimationFrame(() => {
      this.#historyNavigationFrame = undefined;

      const currentSection = portfolioSectionFromUrl(globalThis.location.href) ?? 'home';

      if (currentSection === sectionId) {
        this.#navigation.scrollToSection(sectionId, 'instant');
      }
    });
  };

  #handleSectionIntersections(entries: readonly IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const sectionId = entry.target.id as StaticPageId;

      if (!portfolioSectionIds.includes(sectionId)) {
        continue;
      }

      if (entry.isIntersecting) {
        this.#visibleSections.set(sectionId, entry);
      } else {
        this.#visibleSections.delete(sectionId);
      }
    }

    const currentSection = this.#navigation.activeSection();

    if (currentSection && this.#visibleSections.has(currentSection)) {
      return;
    }

    const viewportCenter = globalThis.innerHeight / 2;
    const nextSection = [...this.#visibleSections.entries()].sort(
      ([firstId, firstEntry], [secondId, secondEntry]) =>
        distanceFromViewportCenter(firstEntry, viewportCenter) -
          distanceFromViewportCenter(secondEntry, viewportCenter) ||
        portfolioSectionIds.indexOf(firstId) - portfolioSectionIds.indexOf(secondId),
    )[0]?.[0];

    if (nextSection) {
      this.#navigation.setActiveSection(nextSection);
    }
  }
}

function distanceFromViewportCenter(
  entry: IntersectionObserverEntry,
  viewportCenter: number,
): number {
  const { bottom, top } = entry.boundingClientRect;

  if (top <= viewportCenter && bottom >= viewportCenter) {
    return 0;
  }

  return Math.min(Math.abs(top - viewportCenter), Math.abs(bottom - viewportCenter));
}
