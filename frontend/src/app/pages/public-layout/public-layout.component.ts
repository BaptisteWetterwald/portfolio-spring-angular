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
  signal,
  ViewChild,
  computed,
} from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { toSupportedLocale } from '../../core/i18n/locales';
import { LighthouseBeamComponent } from '../../shared/lighthouse-beam/lighthouse-beam.component';
import { MaritimeFloatingControlsComponent } from '../../shared/maritime-floating-controls/maritime-floating-controls.component';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../shared/site-header/site-header.component';

export const wideHeaderNavigationQuery = '(min-width: 900px)';
export const headerSonarHandoffRootMargin = '0px';
export const headerSonarHandoffThresholds = [0.58, 0.82] as const;

type WideNavigationState = 'header' | 'sonar';

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
  @ViewChild('siteHeader', { read: ElementRef })
  private siteHeader?: ElementRef<HTMLElement>;

  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #isWideViewport = signal(true);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #wideNavigationState = signal<WideNavigationState>('header');

  protected readonly floatingSonarActive = computed(
    () => !this.#isWideViewport() || this.#wideNavigationState() === 'sonar',
  );
  protected readonly navigationHandoffState = computed<WideNavigationState>(() =>
    this.floatingSonarActive() ? 'sonar' : 'header',
  );

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const locale = toSupportedLocale(route.snapshot.data['locale']);

    localeContext.setLocale(locale);

    if (isPlatformBrowser(this.#platformId)) {
      afterNextRender(() => this.#initializeNavigationHandoff(), { injector: this.#injector });
    }
  }

  #initializeNavigationHandoff(): void {
    const header = this.siteHeader?.nativeElement;

    if (
      !header ||
      typeof globalThis.matchMedia !== 'function' ||
      typeof globalThis.IntersectionObserver !== 'function'
    ) {
      this.#isWideViewport.set(false);
      return;
    }

    const wideViewport = globalThis.matchMedia(wideHeaderNavigationQuery);
    let observer: IntersectionObserver | undefined;
    const configureForViewport = (): void => {
      observer?.disconnect();
      observer = undefined;
      this.#isWideViewport.set(wideViewport.matches);

      if (!wideViewport.matches) {
        return;
      }

      this.#wideNavigationState.set('header');
      observer = new globalThis.IntersectionObserver(
        ([entry]) => {
          if (!entry) {
            return;
          }

          if (entry.intersectionRatio >= headerSonarHandoffThresholds[1]) {
            this.#wideNavigationState.set('header');
          } else if (
            entry.intersectionRatio <= headerSonarHandoffThresholds[0] &&
            entry.boundingClientRect.top < 0
          ) {
            this.#wideNavigationState.set('sonar');
          }
        },
        {
          rootMargin: headerSonarHandoffRootMargin,
          threshold: [...headerSonarHandoffThresholds],
        },
      );
      observer.observe(header);
    };

    configureForViewport();
    wideViewport.addEventListener?.('change', configureForViewport);
    this.#destroyRef.onDestroy(() => {
      observer?.disconnect();
      wideViewport.removeEventListener?.('change', configureForViewport);
    });
  }
}
