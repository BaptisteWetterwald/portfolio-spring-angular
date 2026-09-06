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

  beforeEach(() => {
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

  it('renders only the persistent floating maritime controls from the top of the page', async () => {
    const harness = await createHarness('/en');

    expect(shell(harness).hasAttribute('data-maritime-navigation-mode')).toBe(false);
    expect(floatingControls(harness).getAttribute('aria-hidden')).toBeNull();
    expect(floatingControls(harness).hasAttribute('inert')).toBe(false);
    expect(harness.fixture.nativeElement.querySelector('.site-header__sonar')).toBeNull();
    expect(harness.fixture.nativeElement.querySelector('.site-header .theme-toggle')).toBeNull();
    expect(
      harness.fixture.nativeElement.querySelectorAll('app-lighthouse-theme-toggle'),
    ).toHaveLength(1);
    expect(beam(harness).getAttribute('data-lighthouse-beam-source')).toBe('floating');
  });

  it('keeps the same lighthouse and beam source while the document scrolls', async () => {
    const harness = await createHarness('/en');
    const lighthouse = floatingThemeButton(harness);
    const beamSource = beam(harness);

    globalThis.dispatchEvent(new Event('scroll'));
    await settleHarness(harness);

    expect(floatingThemeButton(harness)).toBe(lighthouse);
    expect(beam(harness)).toBe(beamSource);
    expect(beamSource.getAttribute('data-lighthouse-beam-source')).toBe('floating');
  });

  it('keeps the floating sonar as semantic localized section navigation', async () => {
    const harness = await createHarness('/fr#education');

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

    compactSonarButton(harness).click();
    await settleHarness(harness);

    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('true');

    await harness.navigateByUrl('/en#projects');
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en#projects');
    expect(compactSonarButton(harness).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the collapsed mobile sonar from a pointer tap without relying on a click', async () => {
    setSystemTheme(false, true);
    setViewport(390, 844);
    const harness = await createHarness('/en');

    const button = compactSonarButton(harness);

    button.dispatchEvent(pointerEvent('pointerdown', 44, 797));
    button.dispatchEvent(pointerEvent('pointerup', 44, 797));
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('snaps a mobile drag and still allows a later waypoint tap to navigate', async () => {
    setSystemTheme(false, true);
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

function floatingControls(harness: RouterTestingHarness): HTMLElement {
  return requiredElement(harness.fixture.nativeElement, '.maritime-floating-controls');
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
