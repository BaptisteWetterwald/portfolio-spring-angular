import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Injector,
  PLATFORM_ID,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { localizedPath, StaticPageId, staticPageIds } from '../../core/routing/localized-routes';
import { LocaleSwitcherComponent } from '../locale-switcher/locale-switcher.component';

@Component({
  selector: 'app-site-header',
  imports: [LocaleSwitcherComponent, RouterLink],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  @ViewChild('mobileMenuButton') private mobileMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChildren('mobileNavLink') private mobileNavLinks?: QueryList<ElementRef<HTMLAnchorElement>>;

  protected readonly navPages = staticPageIds;
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly mobileMenuId = 'mobile-primary-navigation';
  protected readonly locale = inject(LocaleContextService).locale;

  readonly #platformId = inject(PLATFORM_ID);
  readonly #injector = inject(Injector);
  readonly #navigation = inject(PortfolioNavigationService);
  readonly #router = inject(Router);
  readonly #translations = inject(TranslationService);

  constructor() {
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMobileMenu());
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.closeMobileMenu({ restoreFocus: true });
  }

  protected localizedPath(pageId: StaticPageId): string {
    return localizedPath(this.locale(), pageId);
  }

  protected sectionHref(pageId: StaticPageId): string {
    return this.#navigation.sectionHref(this.locale(), pageId);
  }

  protected isSectionActive(pageId: StaticPageId): boolean {
    return this.#navigation.isActive(pageId);
  }

  protected handleSectionNavigation(
    event: MouseEvent,
    pageId: StaticPageId,
    closeMobileMenu = false,
  ): void {
    const handled = this.#navigation.navigateToSection(event, this.locale(), pageId);

    if (handled && closeMobileMenu) {
      this.closeMobileMenu();
    }
  }

  protected navLabel(pageId: StaticPageId): string {
    return this.#translations.translate(`nav.${pageId}`);
  }

  protected toggleMobileMenu(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu({ restoreFocus: true });
      return;
    }

    this.openMobileMenu();
  }

  protected openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
    this.#focusFirstMobileLink();
  }

  protected closeMobileMenu(options: { restoreFocus?: boolean } = {}): void {
    const wasOpen = this.isMobileMenuOpen();

    this.isMobileMenuOpen.set(false);

    if (wasOpen && options.restoreFocus) {
      this.#queueBrowserFocus(() => this.mobileMenuButton?.nativeElement.focus());
    }
  }

  protected menuButtonLabel(): string {
    return this.#translations.translate(this.isMobileMenuOpen() ? 'nav.closeMenu' : 'nav.openMenu');
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }

  #focusFirstMobileLink(): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    afterNextRender(
      () => {
        if (this.isMobileMenuOpen()) {
          this.mobileNavLinks?.first?.nativeElement.focus();
        }
      },
      { injector: this.#injector },
    );
  }

  #queueBrowserFocus(callback: () => void): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    queueMicrotask(callback);
  }
}
