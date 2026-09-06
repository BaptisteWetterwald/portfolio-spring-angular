import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';
import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent integration', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalInnerHeight = globalThis.innerHeight;
  const originalInnerWidth = globalThis.innerWidth;
  const originalMatchMedia = globalThis.matchMedia;
  let intersectionObservers: MockIntersectionObserver[];

  beforeEach(() => {
    intersectionObservers = installIntersectionObserverMock();
    setSystemTheme(false);
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

  it('starts in top mode with floating controls inert and the header beam source active', async () => {
    const harness = await createHarness('/en');

    expect(shell(harness).getAttribute('data-maritime-navigation-mode')).toBe('top');
    expect(floatingControls(harness).getAttribute('aria-hidden')).toBe('true');
    expect(floatingControls(harness).hasAttribute('inert')).toBe(true);
    expect(beam(harness).getAttribute('data-lighthouse-beam-source')).toBe('header');
  });

  it('switches to floating mode after the header navigation sentinel leaves and restores top mode when it returns', async () => {
    const harness = await createHarness('/en');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-maritime-navigation-mode')).toBe('floating');
    expect(floatingControls(harness).getAttribute('aria-hidden')).toBeNull();
    expect(floatingControls(harness).hasAttribute('inert')).toBe(false);
    expect(beam(harness).getAttribute('data-lighthouse-beam-source')).toBe('floating');
    expect(headerSonar(harness).getAttribute('aria-hidden')).toBe('true');
    expect(headerSonar(harness).hasAttribute('inert')).toBe(true);

    observerWithRootMargin('-16px 0px 0px 0px').emit(true, 24);
    await settleHarness(harness);

    expect(shell(harness).getAttribute('data-maritime-navigation-mode')).toBe('top');
    expect(beam(harness).getAttribute('data-lighthouse-beam-source')).toBe('header');
    expect(headerSonar(harness).getAttribute('aria-hidden')).toBeNull();
  });

  it('keeps the floating sonar as semantic localized Angular navigation with exact active route state', async () => {
    const harness = await createHarness('/fr/formation');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

    const links = floatingSonarLinks(harness);

    expect(floatingSonar(harness).getAttribute('aria-label')).toBe('Navigation compas compacte');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/fr',
      '/fr/formation',
      '/fr/experience',
      '/fr/projets',
      '/fr/contact',
    ]);
    expect(
      links.find((link) => link.textContent?.trim() === 'Formation')?.getAttribute('aria-current'),
    ).toBe('page');
  });

  it('expands the floating sonar for keyboard focus without collapsing between internal links', async () => {
    const harness = await createHarness('/en');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
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

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

    compactSonarButton(harness).click();
    await settleHarness(harness);

    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('true');

    await harness.navigateByUrl('/en/projects');
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en/projects');
    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the collapsed mobile sonar from a pointer tap without relying on a click', async () => {
    setSystemTheme(false, true);
    setViewport(390, 844);
    const harness = await createHarness('/en');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

    const button = compactSonarButton(harness);

    button.dispatchEvent(pointerEvent('pointerdown', 44, 797));
    button.dispatchEvent(pointerEvent('pointerup', 44, 797));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('snaps a mobile drag without expanding and allows the next tap to expand', async () => {
    setSystemTheme(false, true);
    setViewport(390, 844);
    const harness = await createHarness('/en');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

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
  });

  it('uses the same theme service for header and floating lighthouse controls', async () => {
    const harness = await createHarness('/en');

    observerWithRootMargin('64px 0px 0px 0px').emit(false, -80);
    await settleHarness(harness);

    floatingThemeButton(harness).click();
    await settleHarness(harness);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(headerThemeButton(harness).getAttribute('aria-pressed')).toBe('true');
    expect(floatingThemeButton(harness).getAttribute('aria-pressed')).toBe('true');
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

    expect(shellFromFixture(fixture).getAttribute('data-maritime-navigation-mode')).toBe('top');
    expect(intersectionObserver).not.toHaveBeenCalled();
    expect(matchMedia).not.toHaveBeenCalled();
  });

  function observerWithRootMargin(rootMargin: string): MockIntersectionObserver {
    const observer = intersectionObservers.find((candidate) => candidate.rootMargin === rootMargin);

    expect(observer).toBeDefined();

    return observer as MockIntersectionObserver;
  }
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

function floatingControls(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.maritime-floating-controls');
}

function beam(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.lighthouse-beam');
}

function headerSonar(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.site-header__sonar');
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

function headerThemeButton(harness: RouterTestingHarness): HTMLButtonElement {
  return requiredButton(harness.fixture.nativeElement, '.site-header .theme-toggle');
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

function setSystemTheme(prefersDark: boolean, mobileMatches = false): void {
  const mobileQuery = {
    matches: mobileMatches,
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
    value: vi.fn((query: string) =>
      query.includes('max-width: 640px') ? mobileQuery : mediaQuery,
    ),
  });
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

function installIntersectionObserverMock(): MockIntersectionObserver[] {
  const observers: MockIntersectionObserver[] = [];

  class TestIntersectionObserver implements Partial<IntersectionObserver> {
    readonly root = null;
    readonly rootMargin: string;
    readonly scrollMargin = '0px';
    readonly thresholds = [0];
    readonly observe = vi.fn();
    readonly unobserve = vi.fn();
    readonly disconnect = vi.fn();
    readonly takeRecords = vi.fn(() => []);

    constructor(
      readonly callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? '0px';
      observers.push(this as MockIntersectionObserver);
    }

    emit(isIntersecting: boolean, top: number): void {
      this.callback(
        [
          {
            isIntersecting,
            boundingClientRect: {
              top,
            },
          } as IntersectionObserverEntry,
        ],
        this as IntersectionObserver,
      );
    }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: TestIntersectionObserver,
  });

  return observers;
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

  emit(isIntersecting: boolean, top: number): void;
}
