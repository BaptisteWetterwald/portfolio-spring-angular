import { PLATFORM_ID, signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionPreferenceService } from '../../core/motion/motion-preference.service';
import { ColorTheme, ThemePreferenceService } from '../../core/theme/theme-preference.service';
import { isLanternBeamVisible, LighthouseBeamComponent } from './lighthouse-beam.component';

describe('LighthouseBeamComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('exposes inactive and active beam states from the current theme', () => {
    const theme = signal<ColorTheme>('light');
    const fixture = createFixture({ theme });
    const beam = beamElement(fixture);

    expect(beam.getAttribute('data-lighthouse-beam-state')).toBe('inactive');

    theme.set('dark');
    fixture.detectChanges();

    expect(beam.getAttribute('data-lighthouse-beam-state')).toBe('active');
  });

  it('exposes reduced-motion state so the beam can remain static', () => {
    const reducedMotion = signal(true);
    const fixture = createFixture({ reducedMotion });

    expect(beamElement(fixture).getAttribute('data-lighthouse-beam-motion')).toBe('reduced');
  });

  it('uses the persistent floating lighthouse as its only source', () => {
    const fixture = createFixture({ platformId: 'server' });

    expect(beamElement(fixture).getAttribute('data-lighthouse-beam-source')).toBe('floating');
  });

  it('does not query browser layout while rendering for SSR', () => {
    const querySelector = vi.spyOn(document, 'querySelector');

    createFixture({ platformId: 'server' });

    expect(
      querySelector.mock.calls.some(
        ([selector]) => selector === '[data-lighthouse-lantern="floating"]',
      ),
    ).toBe(false);
  });

  it('hides the beam until the lantern origin is measured', () => {
    const fixture = createFixture({ platformId: 'server' });
    const beam = beamElement(fixture);

    expect(beam.classList.contains('lighthouse-beam--ready')).toBe(false);
    expect(beam.style.getPropertyValue('--lighthouse-beam-origin-x')).toBe('-9999px');
    expect(beam.style.getPropertyValue('--lighthouse-beam-origin-y')).toBe('-9999px');
  });

  it('keeps the beam visible only while the lantern is inside the viewport margin', () => {
    expect(isLanternBeamVisible(rect({ top: 20, bottom: 34 }), 1280, 720)).toBe(true);
    expect(isLanternBeamVisible(rect({ top: -24, bottom: 8 }), 1280, 720)).toBe(false);
    expect(isLanternBeamVisible(rect({ top: 714, bottom: 742 }), 1280, 720)).toBe(false);
    expect(isLanternBeamVisible(rect({ left: -30, right: 8 }), 1280, 720)).toBe(false);
  });
});

function createFixture(options: {
  platformId?: 'browser' | 'server';
  reducedMotion?: WritableSignal<boolean>;
  theme?: WritableSignal<ColorTheme>;
}): ComponentFixture<LighthouseBeamComponent> {
  const theme = options.theme ?? signal<ColorTheme>('light');
  const reducedMotion = options.reducedMotion ?? signal(false);

  TestBed.configureTestingModule({
    imports: [LighthouseBeamComponent],
    providers: [
      { provide: PLATFORM_ID, useValue: options.platformId ?? 'server' },
      {
        provide: ThemePreferenceService,
        useValue: {
          theme: theme.asReadonly(),
        } satisfies Partial<ThemePreferenceService>,
      },
      {
        provide: MotionPreferenceService,
        useValue: {
          prefersReducedMotion: reducedMotion.asReadonly(),
        } satisfies Partial<MotionPreferenceService>,
      },
    ],
  });

  const fixture = TestBed.createComponent(LighthouseBeamComponent);

  fixture.detectChanges();

  return fixture;
}

function beamElement(fixture: ComponentFixture<LighthouseBeamComponent>): HTMLElement {
  const beam = fixture.nativeElement.querySelector('.lighthouse-beam');

  expect(beam).not.toBeNull();

  return beam;
}

function rect(
  partial: Partial<Pick<DOMRectReadOnly, 'bottom' | 'left' | 'right' | 'top'>>,
): Pick<DOMRectReadOnly, 'bottom' | 'left' | 'right' | 'top'> {
  return {
    bottom: partial.bottom ?? 34,
    left: partial.left ?? 20,
    right: partial.right ?? 34,
    top: partial.top ?? 20,
  };
}
