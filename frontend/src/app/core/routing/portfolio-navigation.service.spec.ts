import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PortfolioNavigationService } from './portfolio-navigation.service';

describe('PortfolioNavigationService', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    TestBed.resetTestingModule();
    document.getElementById('education')?.remove();

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

  it.each([
    [false, 'smooth'],
    [true, 'instant'],
  ] as const)(
    'uses %s reduced-motion preference to choose %s explicit scrolling',
    (prefersReducedMotion, expectedBehavior) => {
      setMotionPreference(prefersReducedMotion);
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const navigation = TestBed.inject(PortfolioNavigationService);
      const section = document.createElement('section');
      const scrollIntoView = vi.fn();

      section.id = 'education';
      section.scrollIntoView = scrollIntoView;
      document.body.appendChild(section);

      expect(navigation.scrollToSection('education', 'explicit')).toBe(true);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: expectedBehavior,
        block: 'start',
      });
    },
  );
});

function setMotionPreference(prefersReducedMotion: boolean): void {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: prefersReducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList),
  });
}
