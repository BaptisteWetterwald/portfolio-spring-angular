import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ProjectApiService } from '../../core/projects/project-api.service';
import { projectsPageStateKey } from '../../core/projects/project-resolvers';
import { routes } from '../../app.routes';
import { portfolioScrollSpyRootMargin, PortfolioPageComponent } from './portfolio-page.component';

describe('PortfolioPageComponent integration', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  let observers: MockIntersectionObserver[];
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observers = installIntersectionObserverMock();
    scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    restoreGlobal('IntersectionObserver', originalIntersectionObserver);

    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: originalScrollIntoView,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

  it('resolves a direct fragment after rendering without animated scrolling', async () => {
    const harness = await createHarness('/en#experience');

    expect(TestBed.inject(Router).url).toBe('/en#experience');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
    expect(activeSonarLink(harness)?.getAttribute('href')).toBe('/en#experience');
  });

  it('renders one canonical permalink per unique major section and four inter-section dividers', async () => {
    const harness = await createHarness('/en');
    const page = harness.routeNativeElement?.querySelector('.portfolio-page');
    const sections = Array.from(
      page?.querySelectorAll<HTMLElement>('[data-portfolio-section]') ?? [],
    );
    const sectionIds = sections.map((section) => section.id);
    const permalinks = Array.from(
      page?.querySelectorAll<HTMLAnchorElement>('[data-section-permalink]') ?? [],
    );
    const children = Array.from(page?.children ?? []);

    expect(sectionIds).toEqual(['home', 'experience', 'education', 'projects', 'contact']);
    expect(new Set(sectionIds).size).toBe(5);
    expect(permalinks.map((link) => link.getAttribute('href'))).toEqual([
      '/en#home',
      '/en#experience',
      '/en#education',
      '/en#projects',
      '/en#contact',
    ]);
    expect(page?.querySelectorAll(':scope > .divider[data-portfolio-divider]')).toHaveLength(4);
    expect(page?.querySelector('[data-portfolio-section] [data-portfolio-divider]')).toBeNull();
    expect(
      children.map((child) =>
        child.hasAttribute('data-portfolio-divider') ? 'divider' : child.tagName.toLowerCase(),
      ),
    ).toEqual([
      'app-home-page',
      'divider',
      'app-experience-page',
      'divider',
      'app-education-page',
      'divider',
      'app-projects-page',
      'divider',
      'app-github-activity',
      'app-contact-page',
    ]);
  });

  it('uses the existing explicit navigation path for content permalinks', async () => {
    const harness = await createHarness('/en');
    const permalink = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
      '#experience [data-section-permalink]',
    );

    expect(permalink).toBeInstanceOf(HTMLAnchorElement);

    permalink?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, button: 0, cancelable: true, detail: 1 }),
    );
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en#experience');
    expect(activeSonarLink(harness)?.getAttribute('href')).toBe('/en#experience');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('updates the active waypoint from the center-band observer without rewriting the URL', async () => {
    const harness = await createHarness('/en');
    const observer = observers.find(
      (candidate) => candidate.rootMargin === portfolioScrollSpyRootMargin,
    );
    const home = requiredSection(harness, 'home');
    const education = requiredSection(harness, 'education');

    expect(observer).toBeDefined();

    observer?.emit([intersection(home, true, 0, 1600), intersection(education, false, 1600, 3200)]);
    await settleHarness(harness);
    expect(activeSonarLink(harness)?.getAttribute('href')).toBe('/en#home');

    observer?.emit([intersection(education, true, 720, 2320)]);
    await settleHarness(harness);
    expect(activeSonarLink(harness)?.getAttribute('href')).toBe('/en#home');

    observer?.emit([intersection(home, false, -1500, 100)]);
    await settleHarness(harness);

    expect(activeSonarLink(harness)?.getAttribute('href')).toBe('/en#education');
    expect(TestBed.inject(Router).url).toBe('/en');
  });

  it('owns the localized document metadata once for the composed page', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createHarness('/fr', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledTimes(1);
    expect(metadata.applyStaticPage).toHaveBeenCalledWith('home', 'fr');
  });

  it('does not initialize browser observers or scrolling during SSR', () => {
    const intersectionObserver = vi.fn(() => {
      throw new Error('IntersectionObserver should not run during SSR');
    });
    const metadata = { applyStaticPage: vi.fn() };

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: intersectionObserver,
    });

    TestBed.configureTestingModule({
      imports: [PortfolioPageComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: PageMetadataService, useValue: metadata },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ [projectsPageStateKey]: { kind: 'loaded', projects: [] } }),
            snapshot: {
              data: { [projectsPageStateKey]: { kind: 'loaded', projects: [] } },
            },
            parent: { snapshot: { data: { locale: 'en' } } },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(PortfolioPageComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#home')).not.toBeNull();
    expect(intersectionObserver).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

async function createHarness(
  initialUrl: string,
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: PageMetadataService, useValue: metadata },
      {
        provide: ProjectApiService,
        useValue: {
          listProjects: () => of([]),
        },
      },
    ],
  });

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
}

function activeSonarLink(harness: RouterTestingHarness): HTMLAnchorElement | null {
  return harness.routeNativeElement?.querySelector(
    'app-sonar-navigation a[aria-current="location"]',
  ) as HTMLAnchorElement | null;
}

function requiredSection(harness: RouterTestingHarness, id: string): HTMLElement {
  const section = harness.routeNativeElement?.querySelector(`#${id}`);

  expect(section).toBeInstanceOf(HTMLElement);

  return section as HTMLElement;
}

function intersection(
  target: Element,
  isIntersecting: boolean,
  top: number,
  bottom: number,
): IntersectionObserverEntry {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top, bottom },
  } as IntersectionObserverEntry;
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
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
