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
  input,
  ViewChild,
  ViewChildren,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { localizedPath, StaticPageId, staticPageIds } from '../../core/routing/localized-routes';
import { MaritimeNavigationMode } from '../maritime-navigation-shell/navigation-mode';
import { LighthouseThemeToggleComponent } from '../lighthouse-theme-toggle/lighthouse-theme-toggle.component';
import { LocaleSwitcherComponent } from '../locale-switcher/locale-switcher.component';
import { SonarNavigationComponent } from '../sonar-navigation/sonar-navigation.component';

@Component({
  selector: 'app-site-header',
  imports: [
    LighthouseThemeToggleComponent,
    LocaleSwitcherComponent,
    RouterLink,
    RouterLinkActive,
    SonarNavigationComponent,
  ],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  @ViewChild('mobileMenuButton') private mobileMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChildren('mobileNavLink') private mobileNavLinks?: QueryList<ElementRef<HTMLAnchorElement>>;

  readonly navigationMode = input<MaritimeNavigationMode>('top');

  protected readonly navPages = staticPageIds;
  protected readonly exactPageCurrentOptions = { exact: true };
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly mobileMenuId = 'mobile-primary-navigation';
  protected readonly isFloatingShell = computed(() => this.navigationMode() === 'floating');
  protected readonly locale = inject(LocaleContextService).locale;

  readonly #platformId = inject(PLATFORM_ID);
  readonly #injector = inject(Injector);
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
