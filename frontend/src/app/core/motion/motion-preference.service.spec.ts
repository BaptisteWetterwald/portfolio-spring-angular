import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MotionPreferenceService, reducedMotionMediaQuery } from './motion-preference.service';

describe('MotionPreferenceService', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();

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

  it('tracks the browser reduced-motion preference', () => {
    let motionListener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn(
        (_eventName: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === 'function') {
            motionListener = listener as (event: MediaQueryListEvent) => void;
          }
        },
      ),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const matchMedia = vi.fn().mockReturnValue(mediaQuery);

    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMedia,
    });
    configureService('browser');

    const service = TestBed.inject(MotionPreferenceService);

    expect(matchMedia).toHaveBeenCalledWith(reducedMotionMediaQuery);
    expect(service.prefersReducedMotion()).toBe(true);

    motionListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.prefersReducedMotion()).toBe(false);
  });

  it('does not read browser-only motion APIs during SSR', () => {
    const matchMedia = vi.fn(() => {
      throw new Error('matchMedia should not be called during SSR');
    });

    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMedia,
    });
    configureService('server');

    const service = TestBed.inject(MotionPreferenceService);

    expect(service.prefersReducedMotion()).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
  });
});

function configureService(platformId: 'browser' | 'server'): void {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platformId }],
  });
}
