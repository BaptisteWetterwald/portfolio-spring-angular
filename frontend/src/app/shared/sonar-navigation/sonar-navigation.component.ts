import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { StaticPageId, staticPageIds } from '../../core/routing/localized-routes';
import {
  MobileSonarBounds,
  MobileSonarBubble,
  MobileSonarPlacement,
  MobileSonarPoint,
  clampMobileSonarBubble,
  defaultMobileSonarBubble,
  isMobileSonarDragDistance,
  mobileSonarBreakpointQuery,
  mobileSonarControlGapPx,
  mobileSonarPlacementForBubble,
  snapMobileSonarBubble,
} from './mobile-sonar-placement';

type SonarNavigationVariant = 'primary' | 'floating';

@Component({
  selector: 'app-sonar-navigation',
  templateUrl: './sonar-navigation.component.html',
  styleUrls: [
    './sonar-navigation.component.css',
    './sonar-navigation.motion.css',
    './sonar-navigation.floating.css',
    './sonar-navigation.mobile.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SonarNavigationComponent {
  @ViewChild('compactButton') private compactButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sonarNav') private sonarNav?: ElementRef<HTMLElement>;
  @ViewChild('sonarFrame') private sonarFrame?: ElementRef<HTMLElement>;

  readonly variant = input<SonarNavigationVariant>('primary');

  protected readonly navPages = staticPageIds;
  protected readonly locale = inject(LocaleContextService).locale;

  readonly #navigation = inject(PortfolioNavigationService);
  readonly #router = inject(Router);
  readonly #translations = inject(TranslationService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #escapeCollapsedWhileFocused = signal(false);
  readonly #isFloatingFocused = signal(false);
  readonly #isFloatingPinned = signal(false);
  readonly #isMobileDragging = signal(false);
  #mobileDrag?: MobileSonarDragSession;
  #mobilePlacement?: MobileSonarPlacement;
  #mobilePlacementFrame?: number;
  #mobileQuery?: MediaQueryList;
  #mobileSyncFrame?: number;
  #suppressNextClick = false;
  #suppressNextClickUntil = 0;
  #suppressClickTimeout?: ReturnType<typeof globalThis.setTimeout>;

  protected readonly isFloatingFocused = this.#isFloatingFocused.asReadonly();
  protected readonly isFloatingPinned = this.#isFloatingPinned.asReadonly();
  protected readonly listId = computed(() => `sonar-navigation-${this.variant()}-list`);
  protected readonly isFloatingVariant = computed(() => this.variant() === 'floating');
  protected readonly isFloatingExpanded = computed(
    () =>
      this.isFloatingVariant() &&
      (this.isFloatingPinned() ||
        (this.isFloatingFocused() && !this.#escapeCollapsedWhileFocused())),
  );
  protected readonly navigationClass = computed(() =>
    [
      'sonar-nav',
      `sonar-nav--${this.variant()}`,
      this.isFloatingExpanded() ? 'sonar-nav--floating-expanded' : '',
      this.floatingLinksHidden() ? 'sonar-nav--floating-collapsed' : '',
      this.#isMobileDragging() ? 'sonar-nav--mobile-dragging' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  protected readonly ariaLabel = computed(() =>
    this.#translations.translate(this.isFloatingVariant() ? 'nav.floatingVisual' : 'nav.visual'),
  );
  protected readonly compactButtonLabel = computed(() =>
    this.#translations.translate(
      this.isFloatingExpanded() ? 'nav.closeCompactNavigation' : 'nav.openCompactNavigation',
    ),
  );
  protected readonly floatingLinksHidden = computed(
    () => this.isFloatingVariant() && !this.isFloatingExpanded(),
  );

  constructor() {
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeFloatingNavigation());

    if (isPlatformBrowser(this.#platformId)) {
      afterNextRender(() => this.#initializeMobileDragging(), { injector: this.#injector });
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscapeKey(event: Event): void {
    if (!this.isFloatingExpanded()) {
      return;
    }

    event.preventDefault();
    this.#isFloatingPinned.set(false);
    this.#escapeCollapsedWhileFocused.set(true);

    const activeElement = this.#documentActiveElement();

    if (activeElement && this.sonarFrame?.nativeElement.contains(activeElement)) {
      this.compactButton?.nativeElement.focus({ preventScroll: true });
    }
  }

  protected sectionHref(pageId: StaticPageId): string {
    return this.#navigation.sectionHref(this.locale(), pageId);
  }

  protected isSectionActive(pageId: StaticPageId): boolean {
    return this.#navigation.isActive(pageId);
  }

  protected handleSectionNavigation(event: MouseEvent, pageId: StaticPageId): void {
    if (this.#navigation.navigateToSection(event, this.locale(), pageId)) {
      this.closeFloatingNavigation();
    }
  }

  protected navLabel(pageId: StaticPageId): string {
    return this.#translations.translate(`nav.${pageId}`);
  }

  protected itemClass(pageId: StaticPageId): string {
    return `sonar-nav__item sonar-nav__item--${pageId}`;
  }

  protected handleFloatingFocusIn(): void {
    if (this.#mobileDrag) {
      return;
    }

    if (this.isFloatingVariant()) {
      this.#isFloatingFocused.set(true);
    }
  }

  protected handleFloatingFocusOut(event: FocusEvent): void {
    if (!this.isFloatingVariant()) {
      return;
    }

    const nextTarget = event.relatedTarget;

    if (nextTarget && this.sonarFrame?.nativeElement.contains(nextTarget as Node)) {
      return;
    }

    this.#isFloatingFocused.set(false);
    this.#escapeCollapsedWhileFocused.set(false);
  }

  protected toggleFloatingNavigation(event: MouseEvent): void {
    if (!this.isFloatingVariant()) {
      return;
    }

    this.#clearExpiredClickSuppression();

    if (this.#suppressNextClick) {
      event.preventDefault();
      event.stopPropagation();
      this.#suppressNextClick = false;
      this.#suppressNextClickUntil = 0;
      return;
    }

    this.#escapeCollapsedWhileFocused.set(false);
    this.#syncMobilePlacement();
    this.#isFloatingPinned.update((isPinned) => !isPinned);

    if (!this.#isFloatingPinned() && this.#isFloatingFocused()) {
      (event.currentTarget as HTMLElement | null)?.blur();
      this.#isFloatingFocused.set(false);
    }
  }

  protected closeFloatingNavigation(): void {
    this.#isFloatingPinned.set(false);
  }

  #documentActiveElement(): Element | null {
    return isPlatformBrowser(this.#platformId) ? globalThis.document.activeElement : null;
  }

  protected handleFloatingPointerDown(event: PointerEvent): void {
    this.#clearExpiredClickSuppression();

    if (!this.#canDragMobileSonar()) {
      return;
    }

    const bounds = this.#readMobileBounds();

    if (!bounds) {
      return;
    }

    const placement = this.#ensureMobilePlacement(bounds);

    if (!placement) {
      return;
    }

    this.#mobileDrag = {
      pointerId: event.pointerId,
      bounds,
      hasDragged: false,
      latestBubble: placement.bubble,
      startBubble: placement.bubble,
      startClientX: event.clientX,
      startClientY: event.clientY,
    };

    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  protected handleFloatingPointerMove(event: PointerEvent): void {
    const drag = this.#mobileDrag;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;

    if (!drag.hasDragged && !isMobileSonarDragDistance(deltaX, deltaY)) {
      return;
    }

    drag.hasDragged = true;
    this.#isMobileDragging.set(true);
    event.preventDefault();

    const nextPoint: MobileSonarPoint = {
      x: drag.startBubble.x + deltaX,
      y: drag.startBubble.y + deltaY,
    };
    const nextDockSide = nextPoint.x < drag.bounds.width / 2 ? 'left' : 'right';
    const nextBubble = clampMobileSonarBubble(nextPoint, nextDockSide, drag.bounds);

    drag.latestBubble = nextBubble;
    this.#scheduleMobilePlacement(mobileSonarPlacementForBubble(nextBubble, drag.bounds));
  }

  protected handleFloatingPointerUp(event: PointerEvent): void {
    this.#endMobileDrag(event);
  }

  protected handleFloatingPointerCancel(event: PointerEvent): void {
    this.#endMobileDrag(event);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }

  #initializeMobileDragging(): void {
    if (!this.isFloatingVariant() || !globalThis.matchMedia) {
      return;
    }

    this.#mobileQuery = globalThis.matchMedia(mobileSonarBreakpointQuery);
    this.#mobileQuery.addEventListener?.('change', this.#handleMobileViewportChange);
    globalThis.addEventListener('resize', this.#handleMobileViewportChange, { passive: true });
    globalThis.visualViewport?.addEventListener('resize', this.#handleMobileViewportChange, {
      passive: true,
    });
    this.#syncMobilePlacement();

    this.#destroyRef.onDestroy(() => {
      this.#mobileQuery?.removeEventListener?.('change', this.#handleMobileViewportChange);
      globalThis.removeEventListener('resize', this.#handleMobileViewportChange);
      globalThis.visualViewport?.removeEventListener('resize', this.#handleMobileViewportChange);
      this.#cancelMobileFrames();

      if (this.#suppressClickTimeout !== undefined) {
        globalThis.clearTimeout(this.#suppressClickTimeout);
      }
    });
  }

  readonly #handleMobileViewportChange = (): void => {
    if (this.#mobileSyncFrame !== undefined) {
      return;
    }

    this.#mobileSyncFrame = globalThis.requestAnimationFrame(() => {
      this.#mobileSyncFrame = undefined;
      this.#syncMobilePlacement();
    });
  };

  #canDragMobileSonar(): boolean {
    return (
      this.isFloatingVariant() &&
      this.#isMobileQueryActive() &&
      !this.isFloatingExpanded() &&
      this.#readMobileBounds() !== null
    );
  }

  #ensureMobilePlacement(bounds = this.#readMobileBounds()): MobileSonarPlacement | null {
    if (!this.#isMobileQueryActive()) {
      this.#clearMobilePlacementStyles();
      return null;
    }

    if (!bounds) {
      return null;
    }

    if (!this.#mobilePlacement) {
      this.#mobilePlacement = mobileSonarPlacementForBubble(
        defaultMobileSonarBubble(bounds),
        bounds,
      );
    }

    this.#applyMobilePlacement(this.#mobilePlacement);

    return this.#mobilePlacement;
  }

  #syncMobilePlacement(): void {
    if (!this.#isMobileQueryActive()) {
      this.#clearMobilePlacementStyles();
      return;
    }

    const bounds = this.#readMobileBounds();

    if (!bounds) {
      return;
    }

    const bubble = this.#mobilePlacement
      ? snapMobileSonarBubble(this.#mobilePlacement.bubble, bounds)
      : defaultMobileSonarBubble(bounds);
    this.#mobilePlacement = mobileSonarPlacementForBubble(bubble, bounds);
    this.#applyMobilePlacement(this.#mobilePlacement);
  }

  #scheduleMobilePlacement(placement: MobileSonarPlacement): void {
    this.#mobilePlacement = placement;

    if (this.#mobilePlacementFrame !== undefined) {
      return;
    }

    this.#mobilePlacementFrame = globalThis.requestAnimationFrame(() => {
      this.#mobilePlacementFrame = undefined;

      if (this.#mobilePlacement) {
        this.#applyMobilePlacement(this.#mobilePlacement);
      }
    });
  }

  #endMobileDrag(event: PointerEvent): void {
    const drag = this.#mobileDrag;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId);

    if (drag.hasDragged) {
      const bounds = this.#readMobileBounds() ?? drag.bounds;
      const snappedBubble = snapMobileSonarBubble(drag.latestBubble, bounds);

      event.preventDefault();
      this.#isMobileDragging.set(false);
      this.#mobilePlacement = mobileSonarPlacementForBubble(snappedBubble, bounds);
      this.#applyMobilePlacement(this.#mobilePlacement);
      this.#suppressNextFloatingClick();
    } else if (!this.isFloatingExpanded()) {
      event.preventDefault();
      this.#syncMobilePlacement();
      this.#isFloatingPinned.set(true);
      this.#suppressNextFloatingClick();
    }

    this.#mobileDrag = undefined;
  }

  #suppressNextFloatingClick(): void {
    this.#suppressNextClick = true;
    this.#suppressNextClickUntil = globalThis.performance.now() + 350;

    if (this.#suppressClickTimeout !== undefined) {
      globalThis.clearTimeout(this.#suppressClickTimeout);
    }

    this.#suppressClickTimeout = globalThis.setTimeout(() => {
      this.#suppressNextClick = false;
      this.#suppressNextClickUntil = 0;
      this.#suppressClickTimeout = undefined;
    }, 350);
  }

  #clearExpiredClickSuppression(): void {
    if (this.#suppressNextClick && globalThis.performance.now() >= this.#suppressNextClickUntil) {
      this.#suppressNextClick = false;
      this.#suppressNextClickUntil = 0;
    }
  }

  #readMobileBounds(): MobileSonarBounds | null {
    const sonarElement = this.sonarNav?.nativeElement;

    if (!sonarElement || !this.#isMobileQueryActive()) {
      return null;
    }

    const viewport = globalThis.visualViewport;
    const width = viewport?.width ?? globalThis.innerWidth;
    const height = viewport?.height ?? globalThis.innerHeight;
    const rootStyles = globalThis.getComputedStyle(document.documentElement);
    const fallbackEdge = cssPixelValue(rootStyles.getPropertyValue('--space-3'), 12);
    const fallbackTop = cssPixelValue(rootStyles.getPropertyValue('--space-4'), 16);
    const fallbackBottom = fallbackTop;
    const sonarHost = sonarElement.closest('.maritime-floating-controls__sonar');
    const controls = sonarElement.closest('.maritime-floating-controls');
    const sonarHostRect = usableElementRect(sonarHost?.getBoundingClientRect());
    const lighthouseRect = usableElementRect(
      controls?.querySelector('.maritime-floating-controls__lighthouse')?.getBoundingClientRect(),
    );
    const sonarRect = sonarElement.getBoundingClientRect();
    const expandedSize = sonarRect.width || Math.min(292, width - 104, height - 96);
    const sonarStyles = globalThis.getComputedStyle(sonarElement);
    const surfaceScale = cssPixelValue(sonarStyles.getPropertyValue('--sonar-surface-scale'), 0);

    return {
      width,
      height,
      safeLeft: positiveRectInset(sonarHostRect?.left, fallbackEdge),
      safeRight: positiveRectInset(
        lighthouseRect ? width - lighthouseRect.right : undefined,
        fallbackEdge,
      ),
      safeTop: fallbackTop,
      safeBottom: positiveRectInset(
        sonarHostRect ? height - sonarHostRect.bottom : undefined,
        fallbackBottom,
      ),
      expandedSize,
      surfaceScale: surfaceScale || 0.22,
      controlGap: mobileSonarControlGapPx,
      lighthouseSafeZone: lighthouseRect
        ? {
            left: lighthouseRect.left,
            top: lighthouseRect.top,
            right: lighthouseRect.right,
            bottom: lighthouseRect.bottom,
          }
        : undefined,
    };
  }

  #applyMobilePlacement(placement: MobileSonarPlacement): void {
    const sonarElement = this.sonarNav?.nativeElement;

    if (!sonarElement) {
      return;
    }

    sonarElement.style.setProperty('--sonar-mobile-panel-left', cssPx(placement.panelLeft));
    sonarElement.style.setProperty('--sonar-mobile-panel-top', cssPx(placement.panelTop));
    sonarElement.style.setProperty('--sonar-mobile-panel-bottom', 'auto');
    sonarElement.style.setProperty('--sonar-mobile-origin-x', cssPx(placement.transformOriginX));
    sonarElement.style.setProperty('--sonar-mobile-origin-y', cssPx(placement.transformOriginY));
    sonarElement.dataset['sonarMobileDock'] = placement.bubble.dockSide;
  }

  #clearMobilePlacementStyles(): void {
    this.#mobilePlacement = undefined;
    this.sonarNav?.nativeElement.removeAttribute('data-sonar-mobile-dock');
    this.sonarNav?.nativeElement.style.removeProperty('--sonar-mobile-panel-left');
    this.sonarNav?.nativeElement.style.removeProperty('--sonar-mobile-panel-top');
    this.sonarNav?.nativeElement.style.removeProperty('--sonar-mobile-panel-bottom');
    this.sonarNav?.nativeElement.style.removeProperty('--sonar-mobile-origin-x');
    this.sonarNav?.nativeElement.style.removeProperty('--sonar-mobile-origin-y');
  }

  #isMobileQueryActive(): boolean {
    return this.#mobileQuery?.matches === true;
  }

  #cancelMobileFrames(): void {
    if (this.#mobilePlacementFrame !== undefined) {
      globalThis.cancelAnimationFrame(this.#mobilePlacementFrame);
      this.#mobilePlacementFrame = undefined;
    }

    if (this.#mobileSyncFrame !== undefined) {
      globalThis.cancelAnimationFrame(this.#mobileSyncFrame);
      this.#mobileSyncFrame = undefined;
    }
  }
}

function cssPixelValue(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(value ?? '');

  return Number.isFinite(parsed) ? parsed : fallback;
}

function cssPx(value: number): string {
  return `${Math.round(value * 1000) / 1000}px`;
}

function positiveRectInset(value: number | undefined, fallback: number): number {
  return Math.max(0, Number.isFinite(value) ? (value as number) : fallback);
}

function usableElementRect(rect: DOMRect | undefined): DOMRect | undefined {
  return rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
}

interface MobileSonarDragSession {
  bounds: MobileSonarBounds;
  hasDragged: boolean;
  latestBubble: MobileSonarBubble;
  pointerId: number;
  startBubble: MobileSonarBubble;
  startClientX: number;
  startClientY: number;
}
