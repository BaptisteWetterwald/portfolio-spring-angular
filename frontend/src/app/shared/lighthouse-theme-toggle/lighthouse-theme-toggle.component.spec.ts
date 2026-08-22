import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ColorTheme,
  themeCookieName,
  themeStorageKey,
} from '../../core/theme/theme-preference.service';
import { LighthouseThemeToggleComponent } from './lighthouse-theme-toggle.component';

describe('LighthouseThemeToggleComponent', () => {
  const originalMatchMedia = globalThis.matchMedia;

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

    if (originalMatchMedia) {
      Object.defineProperty(globalThis, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'matchMedia');
    }
  });

  it('exposes an accessible name and pressed state for the active theme', () => {
    const fixture = createFixture('light');
    const button = themeButton(fixture);

    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Light theme is active');
  });

  it('toggles theme through the real button control', () => {
    const fixture = createFixture('light');
    const button = themeButton(fixture);

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Dark theme is active');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(globalThis.localStorage?.getItem(themeStorageKey)).toBe('dark');
  });
});

function createFixture(systemTheme: ColorTheme): ComponentFixture<LighthouseThemeToggleComponent> {
  setSystemTheme(systemTheme);
  TestBed.configureTestingModule({
    imports: [LighthouseThemeToggleComponent],
    providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
  });

  const fixture = TestBed.createComponent(LighthouseThemeToggleComponent);

  fixture.detectChanges();

  return fixture;
}

function themeButton(fixture: ComponentFixture<LighthouseThemeToggleComponent>): HTMLButtonElement {
  const button = fixture.nativeElement.querySelector('button');

  expect(button).not.toBeNull();

  return button;
}

function setSystemTheme(theme: ColorTheme): void {
  const mediaQuery = {
    matches: theme === 'dark',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });
}
