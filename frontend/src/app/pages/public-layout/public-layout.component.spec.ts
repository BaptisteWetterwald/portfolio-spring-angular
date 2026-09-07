import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';
import {
  headerSonarHandoffRootMargin,
  headerSonarHandoffThresholds,
  PublicLayoutComponent,
} from './public-layout.component';

describe('PublicLayoutComponent integration', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalInnerHeight = globalThis.innerHeight;
  const originalInnerWidth = globalThis.innerWidth;
  const originalMatchMedia = globalThis.matchMedia;
  let observers: MockIntersectionObserver[];

  beforeEach(() => {
    observers = installIntersectionObserverMock();
    setSystemTheme(false, false, true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();

    try {
      globalThis.localStorage?.removeItem(themeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${themeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    setViewport(originalInnerWidth, originalInnerHeight);

    restoreGlobal('IntersectionObserver', originalIntersectionObserver);
    restoreGlobal('matchMedia', originalMatchMedia);
  });

  it('defaults to conventional header navigation with an inert hidden sonar on wide screens', async () => {
    const harness = await createHarness('/en');

    expect(shell(harness).getAttribute('data-navigation-handoff-state')).toBe('header');
    expect(floatingSonarHost(harness).getAttribute('aria-hidden')).toBe('true');
    expect(floatingSonarHost(harness).hasAttribute('inert')).toBe(true);
    expect(headerNavigation(harness).getAttribute('aria-hidden')).toBeNull();
    expect(headerNavigation(harness).hasAttribute('inert')).toBe(false);
    expect(harness.fixture.nativeElement.querySelector('.site-header__sonar')).toBeNull();
    expect(harness.fixture.nativeElement.querySelector('.site-header .theme-toggle')).toBeNull();
    expect(
      harness.fixture.nativeElement.querySelectorAll('app-lighthouse-theme-toggle'),
    ).toHaveLength(1);
    expect(beam(harness).getAttribute('data-lighthouse-beam-source')).toBe('floating');
  });

  it('activates the sonar below the exit threshold and restores the header above the return threshold', async () => {
    const harness = await createHarness('/en');
    const observer = handoffObserver(observers);

    expect(observer.rootMargin).toBe(headerSonarHandoffRootMargin);
    expect(observer.thresholds).toEqual([...headerSonarHandoffThresholds]);

    observer.emit([headerEntry(siteHeaderHost(harness), 0.57, -31)]);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-navigation-handoff-state')).toBe('sonar');
    expect(floatingSonarHost(harness).getAttribute('aria-hidden')).toBeNull();
    expect(floatingSonarHost(harness).hasAttribute('inert')).toBe(false);
    expect(headerNavigation(harness).getAttribute('aria-hidden')).toBe('true');
    expect(headerNavigation(harness).hasAttribute('inert')).toBe(true);

    observer.emit([headerEntry(siteHeaderHost(harness), 0.7, -20)]);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-navigation-handoff-state')).toBe('sonar');

    observer.emit([headerEntry(siteHeaderHost(harness), 0.83, -12)]);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-navigation-handoff-state')).toBe('header');
    expect(floatingSonarHost(harness).getAttribute('aria-hidden')).toBe('true');
    expect(floatingSonarHost(harness).hasAttribute('inert')).toBe(true);
    expect(headerNavigation(harness).getAttribute('aria-hidden')).toBeNull();
    expect(headerNavigation(harness).hasAttribute('inert')).toBe(false);
  });

  it('keeps focused header navigation available until focus leaves during handoff', async () => {
    const harness = await createHarness('/en');
    const navigation = headerNavigation(harness);
    const firstLink = requiredElement(navigation, 'a');
    const localeControl = requiredElement(harness.fixture.nativeElement, 'app-locale-switcher a');

    firstLink.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    handoffObserver(observers).emit([headerEntry(siteHeaderHost(harness), 0.5, -36)]);
    await settleHarness(harness);

    expect(navigation.classList.contains('site-header__nav--handoff')).toBe(true);
    expect(navigation.getAttribute('aria-hidden')).toBeNull();
    expect(navigation.hasAttribute('inert')).toBe(false);

    firstLink.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: localeControl }),
    );
    await settleHarness(harness);

    expect(navigation.getAttribute('aria-hidden')).toBe('true');
    expect(navigation.hasAttribute('inert')).toBe(true);
  });

  it('keeps a focused sonar available until focus leaves during the reverse handoff', async () => {
    const harness = await createHarness('/en');
    const sonarHost = floatingSonarHost(harness);
    const button = compactSonarButton(harness);
    const headerLink = requiredElement(headerNavigation(harness), 'a');
    const observer = handoffObserver(observers);

    observer.emit([headerEntry(siteHeaderHost(harness), 0.5, -36)]);
    await settleHarness(harness);
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    observer.emit([headerEntry(siteHeaderHost(harness), 0.9, 0)]);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-navigation-handoff-state')).toBe('header');
    expect(sonarHost.getAttribute('aria-hidden')).toBeNull();
    expect(sonarHost.hasAttribute('inert')).toBe(false);

    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: headerLink }));
    await settleHarness(harness);

    expect(sonarHost.getAttribute('aria-hidden')).toBe('true');
    expect(sonarHost.hasAttribute('inert')).toBe(true);
  });

  it('keeps the same lighthouse and beam source through the navigation handoff', async () => {
    const harness = await createHarness('/en');
    const lighthouse = floatingThemeButton(harness);
    const beamSource = beam(harness);

    handoffObserver(observers).emit([headerEntry(siteHeaderHost(harness), 0.5, -36)]);
    await settleHarness(harness);

    expect(floatingThemeButton(harness)).toBe(lighthouse);
    expect(beam(harness)).toBe(beamSource);
    expect(beamSource.getAttribute('data-lighthouse-beam-source')).toBe('floating');
  });

  it('keeps active-section state synchronized across the navigation handoff', async () => {
    const harness = await createHarness('/fr#education');
    const headerActiveLink = headerNavigation(harness).querySelector('[aria-current="location"]');

    expect(headerActiveLink?.textContent?.trim()).toBe('Formation');

    handoffObserver(observers).emit([headerEntry(siteHeaderHost(harness), 0.4, -43)]);
    await settleHarness(harness);

    const links = floatingSonarLinks(harness);

    expect(floatingSonar(harness).getAttribute('aria-label')).toBe('Navigation compas compacte');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/fr#home',
      '/fr#education',
      '/fr#experience',
      '/fr#projects',
      '/fr#contact',
    ]);
    expect(
      links.find((link) => link.textContent?.trim() === 'Formation')?.getAttribute('aria-current'),
    ).toBe('location');
  });

  it('expands the floating sonar for keyboard focus without collapsing between internal links', async () => {
    const harness = await createHarness('/en');
    activateFloatingSonar(harness, observers);
    await settleHarness(harness);

    const button = compactSonarButton(harness);
    const firstLink = floatingSonarLinks(harness)[0];

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(firstLink?.getAttribute('tabindex')).toBe('-1');

    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(firstLink?.getAttribute('tabindex')).toBeNull();

    button.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: firstLink,
      }),
    );
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('supports click expansion for touch-style interaction and closes after route navigation', async () => {
    const harness = await createHarness('/en');
    activateFloatingSonar(harness, observers);
    await settleHarness(harness);

    compactSonarButton(harness).click();
    await settleHarness(harness);

    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('true');

    await harness.navigateByUrl('/en#projects');
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en#projects');
    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the collapsed mobile sonar from a pointer tap without relying on a click', async () => {
    setSystemTheme(false, true, false);
    setViewport(390, 844);
    const harness = await createHarness('/en');

    const button = compactSonarButton(harness);

    button.dispatchEvent(pointerEvent('pointerdown', 44, 797));
    button.dispatchEvent(pointerEvent('pointerup', 44, 797));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('snaps a mobile drag and still allows a later waypoint tap to navigate', async () => {
    setSystemTheme(false, true, false);
    setViewport(390, 844);
    const harness = await createHarness('/en');

    const sonar = floatingSonar(harness);
    const button = compactSonarButton(harness);

    button.dispatchEvent(pointerEvent('pointerdown', 44, 797));
    button.dispatchEvent(pointerEvent('pointermove', 350, 420));
    button.dispatchEvent(pointerEvent('pointerup', 350, 420));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(sonar.getAttribute('data-sonar-mobile-dock')).toBe('right');

    button.dispatchEvent(pointerEvent('pointerdown', 347, 420));
    button.dispatchEvent(pointerEvent('pointerup', 347, 420));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');

    floatingSonarLinks(harness)
      .find((link) => link.textContent?.trim() === 'Projects')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en#projects');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses the persistent lighthouse to update the shared theme state', async () => {
    const harness = await createHarness('/en');

    floatingThemeButton(harness).click();
    await settleHarness(harness);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(floatingThemeButton(harness).getAttribute('aria-pressed')).toBe('true');
    expect(harness.fixture.nativeElement.querySelectorAll('.theme-toggle')).toHaveLength(1);
  });

  it('does not initialize intersection observers during SSR rendering', () => {
    const intersectionObserver = vi.fn(() => {
      throw new Error('IntersectionObserver should not run during SSR');
    });
    const matchMedia = vi.fn(() => {
      throw new Error('Mobile sonar geometry should not run during SSR');
    });

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: intersectionObserver,
    });
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMedia,
    });

    TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = TestBed.createComponent(PublicLayoutComponent);

    fixture.detectChanges();

    expect(shellFromFixture(fixture).hasAttribute('data-maritime-navigation-mode')).toBe(false);
    expect(shellFromFixture(fixture).getAttribute('data-navigation-handoff-state')).toBe('header');
    expect(floatingSonarHostFromFixture(fixture).getAttribute('aria-hidden')).toBe('true');
    expect(floatingSonarHostFromFixture(fixture).hasAttribute('inert')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('app-lighthouse-theme-toggle')).toHaveLength(1);
    expect(intersectionObserver).not.toHaveBeenCalled();
    expect(matchMedia).not.toHaveBeenCalled();
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function shell(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.public-shell');
}

function shellFromFixture(fixture: ComponentFixture<PublicLayoutComponent>): HTMLElement {
  return requiredElement(fixture.nativeElement, '.public-shell');
}

function floatingSonarHost(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.maritime-floating-controls__sonar');
}

function floatingSonarHostFromFixture(
  fixture: ComponentFixture<PublicLayoutComponent>,
): HTMLElement {
  return requiredElement(fixture.nativeElement, '.maritime-floating-controls__sonar');
}

function headerNavigation(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.site-header__nav');
}

function siteHeaderHost(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, 'app-site-header');
}

function beam(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.lighthouse-beam');
}

function floatingSonar(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(
    harness.fixture.nativeElement,
    '.maritime-floating-controls nav[data-sonar-nav][data-sonar-nav-variant="floating"]',
  );
}

function floatingSonarLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
  return Array.from(floatingSonar(harness).querySelectorAll('a')).filter(
    (link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement,
  );
}

function compactSonarButton(harness: RouterTestingHarness): HTMLButtonElement {
  const button = floatingSonar(harness).querySelector('.sonar-nav__compact-button');

  expect(button).toBeInstanceOf(HTMLButtonElement);

  return button as HTMLButtonElement;
}

function floatingThemeButton(harness: RouterTestingHarness): HTMLButtonElement {
  return requiredButton(harness.fixture.nativeElement, '.maritime-floating-controls .theme-toggle');
}

function requiredButton(root: ParentNode, selector: string): HTMLButtonElement {
  const button = root.querySelector(selector);

  expect(button).toBeInstanceOf(HTMLButtonElement);

  return button as HTMLButtonElement;
}

function requiredElement(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector(selector);

  expect(element).toBeInstanceOf(HTMLElement);

  return element as HTMLElement;
}

function setSystemTheme(
  prefersDark: boolean,
  mobileMatches = false,
  wideMatches = true,
  reducedMotion = false,
): void {
  const mobileQuery = {
    matches: mobileMatches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  const wideQuery = {
    matches: wideMatches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  const reducedMotionQuery = {
    matches: reducedMotion,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  const mediaQuery = {
    matches: prefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => {
      if (query.includes('max-width: 640px')) {
        return mobileQuery;
      }
      if (query.includes('min-width: 900px')) {
        return wideQuery;
      }
      if (query.includes('prefers-reduced-motion')) {
        return reducedMotionQuery;
      }
      return mediaQuery;
    }),
  });
}

function installIntersectionObserverMock(): MockIntersectionObserver[] {
  const observers: MockIntersectionObserver[] = [];

  class TestIntersectionObserver implements Partial<IntersectionObserver> {
    readonly root = null;
    readonly rootMargin: string;
    readonly scrollMargin = '0px';
    readonly thresholds: readonly number[];
    readonly observe = vi.fn();
    readonly unobserve = vi.fn();
    readonly disconnect = vi.fn();
    readonly takeRecords = vi.fn(() => []);

    constructor(
      readonly callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? '0px';
      this.thresholds = Array.isArray(options?.threshold)
        ? options.threshold
        : [options?.threshold ?? 0];
      observers.push(this as MockIntersectionObserver);
    }

    emit(entries: IntersectionObserverEntry[]): void {
      this.callback(entries, this as IntersectionObserver);
    }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: TestIntersectionObserver,
  });

  return observers;
}

function handoffObserver(observers: MockIntersectionObserver[]): MockIntersectionObserver {
  const observer = observers.find(
    (candidate) =>
      candidate.rootMargin === headerSonarHandoffRootMargin &&
      candidate.thresholds.join(',') === headerSonarHandoffThresholds.join(','),
  );

  expect(observer).toBeDefined();

  return observer as MockIntersectionObserver;
}

function activateFloatingSonar(
  harness: RouterTestingHarness,
  observers: MockIntersectionObserver[],
): void {
  handoffObserver(observers).emit([headerEntry(siteHeaderHost(harness), 0.5, -36)]);
}

function headerEntry(
  target: HTMLElement,
  intersectionRatio: number,
  top: number,
): IntersectionObserverEntry {
  return {
    target,
    isIntersecting: intersectionRatio > 0,
    intersectionRatio,
    boundingClientRect: { top },
  } as unknown as IntersectionObserverEntry;
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(globalThis, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(globalThis, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
}

function pointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as PointerEvent;

  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: 1 },
  });

  return event;
}

function restoreGlobal<T>(name: keyof typeof globalThis, value: T): void {
  if (value) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
    return;
  }

  Reflect.deleteProperty(globalThis, name);
}

interface MockIntersectionObserver extends IntersectionObserver {
  readonly callback: IntersectionObserverCallback;

  emit(entries: IntersectionObserverEntry[]): void;
}
