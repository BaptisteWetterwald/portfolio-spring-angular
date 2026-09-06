import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  PLATFORM_ID,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { SupportedLocale, toSupportedLocale } from '../../core/i18n/locales';
import { LighthouseBeamComponent } from '../../shared/lighthouse-beam/lighthouse-beam.component';
import { LighthouseBeamSource } from '../../shared/lighthouse-beam/lighthouse-beam-source';
import { MaritimeFloatingControlsComponent } from '../../shared/maritime-floating-controls/maritime-floating-controls.component';
import { MaritimeNavigationMode } from '../../shared/maritime-navigation-shell/navigation-mode';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../shared/site-header/site-header.component';

const floatingTriggerRootMargin = '64px 0px 0px 0px';
const topRestoreRootMargin = '-16px 0px 0px 0px';

@Component({
  selector: 'app-public-layout',
  imports: [
    LighthouseBeamComponent,
    MaritimeFloatingControlsComponent,
    RouterOutlet,
    SiteFooterComponent,
    SiteHeaderComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  @ViewChild('navigationSentinel') private navigationSentinel?: ElementRef<HTMLElement>;

  protected readonly locale: () => SupportedLocale;
  protected readonly navigationMode = signal<MaritimeNavigationMode>('top');
  protected readonly activeBeamSource = computed<LighthouseBeamSource>(() =>
    this.navigationMode() === 'floating' ? 'floating' : 'header',
  );

  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #platformId = inject(PLATFORM_ID);

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const locale = toSupportedLocale(route.snapshot.data['locale']);

    localeContext.setLocale(locale);
    this.locale = localeContext.locale;

    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    afterNextRender(() => this.#initializeShellNavigationObservers(), {
      injector: this.#injector,
    });
  }

  #initializeShellNavigationObservers(): void {
    const sentinel = this.navigationSentinel?.nativeElement;

    if (!sentinel || typeof globalThis.IntersectionObserver !== 'function') {
      return;
    }

    const floatingObserver = new globalThis.IntersectionObserver(
      ([entry]) => {
        if (entry && !entry.isIntersecting && entry.boundingClientRect.top < 0) {
          this.navigationMode.set('floating');
        }
      },
      {
        rootMargin: floatingTriggerRootMargin,
        threshold: 0,
      },
    );
    const topObserver = new globalThis.IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          this.navigationMode.set('top');
        }
      },
      {
        rootMargin: topRestoreRootMargin,
        threshold: 0,
      },
    );

    floatingObserver.observe(sentinel);
    topObserver.observe(sentinel);

    this.#destroyRef.onDestroy(() => {
      floatingObserver.disconnect();
      topObserver.disconnect();
    });
  }
}
