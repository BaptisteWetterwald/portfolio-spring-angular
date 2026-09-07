import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injector,
  PLATFORM_ID,
  signal,
} from '@angular/core';

import { MotionPreferenceService } from '../../core/motion/motion-preference.service';
import { ThemePreferenceService } from '../../core/theme/theme-preference.service';
const hiddenOrigin = '-9999px';
const viewportFadeMarginPx = 12;
const lighthouseLanternSelector = '[data-lighthouse-lantern="floating"]';

@Component({
  selector: 'app-lighthouse-beam',
  templateUrl: './lighthouse-beam.component.html',
  styleUrl: './lighthouse-beam.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LighthouseBeamComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #motionPreference = inject(MotionPreferenceService);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #themePreference = inject(ThemePreferenceService);

  protected readonly originX = signal(hiddenOrigin);
  protected readonly originY = signal(hiddenOrigin);
  protected readonly isReady = signal(false);
  protected readonly beamState = computed(() =>
    this.#themePreference.theme() === 'dark' ? 'active' : 'inactive',
  );
  protected readonly motionState = computed(() =>
    this.#motionPreference.prefersReducedMotion() ? 'reduced' : 'standard',
  );

  constructor() {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    afterNextRender(() => this.#initializeBrowserMeasurement(), { injector: this.#injector });
  }

  #initializeBrowserMeasurement(): void {
    let frameId: number | undefined;
    const lantern =
      this.#document.querySelector<HTMLElement>(lighthouseLanternSelector) ?? undefined;
    const observedContainer = lantern?.closest('app-lighthouse-theme-toggle') ?? undefined;
    const resizeObserver =
      typeof globalThis.ResizeObserver === 'function'
        ? new globalThis.ResizeObserver(() => scheduleMeasure())
        : undefined;
    const measure = (): void => {
      frameId = undefined;

      if (!lantern?.isConnected) {
        this.originX.set(hiddenOrigin);
        this.originY.set(hiddenOrigin);
        this.isReady.set(false);
        return;
      }

      const rect = lantern.getBoundingClientRect();
      const viewportSize = this.#readViewportSize();

      this.originX.set(toCssPixelValue(rect.left + rect.width / 2));
      this.originY.set(toCssPixelValue(rect.top + rect.height / 2));
      this.isReady.set(isLanternBeamVisible(rect, viewportSize.width, viewportSize.height));
    };
    const scheduleMeasure = (): void => {
      if (frameId !== undefined) {
        return;
      }

      if (typeof globalThis.requestAnimationFrame === 'function') {
        frameId = globalThis.requestAnimationFrame(measure);
        return;
      }

      measure();
    };

    if (lantern) {
      resizeObserver?.observe(lantern);
    }

    if (observedContainer) {
      resizeObserver?.observe(observedContainer);
    }

    measure();

    globalThis.addEventListener('resize', scheduleMeasure, { passive: true });

    this.#destroyRef.onDestroy(() => {
      if (frameId !== undefined && typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      globalThis.removeEventListener('resize', scheduleMeasure);
    });
  }

  #readViewportSize(): { width: number; height: number } {
    return {
      width: globalThis.innerWidth || this.#document.documentElement.clientWidth,
      height: globalThis.innerHeight || this.#document.documentElement.clientHeight,
    };
  }
}

export function isLanternBeamVisible(
  rect: Pick<DOMRectReadOnly, 'bottom' | 'left' | 'right' | 'top'>,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return false;
  }

  return (
    rect.bottom > viewportFadeMarginPx &&
    rect.top < viewportHeight - viewportFadeMarginPx &&
    rect.right > viewportFadeMarginPx &&
    rect.left < viewportWidth - viewportFadeMarginPx
  );
}

export function toCssPixelValue(value: number): string {
  return `${Math.round(value * 100) / 100}px`;
}
