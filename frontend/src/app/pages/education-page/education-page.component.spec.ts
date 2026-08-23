import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { portfolioContent } from '../../core/content/portfolio-content';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { EducationPageComponent } from './education-page.component';

describe('EducationPageComponent', () => {
  it('renders confirmed education entries in the approved order', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryHeadings(page)).toEqual([
      'ENSISA',
      'IUT Robert Schuman',
      'Université du Québec à Chicoutimi',
    ]);
    expect(page.textContent).toContain('Engineering Degree');
    expect(page.textContent).toContain('Computer Science and Networks');
    expect(page.textContent).toContain('DUT Computer Science');
    expect(page.textContent).toContain('International semester');
  });

  it('renders localized French degree labels with the same factual entries', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryHeadings(page)).toEqual([
      'ENSISA',
      'IUT Robert Schuman',
      'Université du Québec à Chicoutimi',
    ]);
    expect(page.textContent).toContain("Diplôme d'ingénieur");
    expect(page.textContent).toContain('Informatique et réseaux');
    expect(page.textContent).toContain('DUT informatique');
    expect(page.textContent).toContain('Semestre international');
  });

  it('uses semantic time elements for confirmed date ranges', async () => {
    const fixture = await createFixture('en');
    const times = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTimeElement>('time'),
    );

    expect(times.map((time) => time.getAttribute('datetime'))).toEqual([
      '2022',
      '2025',
      '2020',
      '2022',
    ]);
  });

  it('uses a daisyUI timeline foundation without changing document order', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const timeline = page.querySelector('ol.timeline.timeline-vertical');
    const entries = Array.from(page.querySelectorAll<HTMLElement>('article.timeline-page__entry'));

    expect(timeline).not.toBeNull();
    expect(timeline?.classList.contains('timeline-snap-icon')).toBe(true);
    expect(timeline?.classList.contains('max-md:timeline-compact')).toBe(true);
    expect(page.querySelectorAll('.timeline-page__waypoint[aria-hidden="true"]').length).toBe(3);
    expect(page.querySelectorAll('hr.timeline-page__route-line').length).toBe(4);
    expect(entries.map((entry) => timelineSide(entry))).toEqual(['start', 'end', 'start']);
    expect(entryHeadings(page)).toEqual([
      'ENSISA',
      'IUT Robert Schuman',
      'Université du Québec à Chicoutimi',
    ]);
  });

  it('links only the school name and metadata logo areas when an official website is available', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('a.timeline-page__identity-link'),
    );
    const logoLinks = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('a.timeline-page__logo-link'),
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.ensisa.uha.fr/',
      'https://iutrs.unistra.fr/',
      'https://www.uqac.ca/',
    ]);
    expect(links.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(links.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(links[0].getAttribute('aria-label')).toContain('Official website');
    expect(links.every((link) => link.closest('h2'))).toBe(true);
    expect(links.every((link) => link.querySelector('.timeline-page__logo-frame'))).toBe(false);
    expect(logoLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.ensisa.uha.fr/',
      'https://iutrs.unistra.fr/',
      'https://www.uqac.ca/',
    ]);
    expect(logoLinks.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(logoLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
      true,
    );
    expect(logoLinks[0].getAttribute('aria-label')).toContain('logo - Official website');
    expect(logoLinks.every((link) => link.closest('.timeline-page__meta'))).toBe(true);
    expect(imageSources(logoLinks)).toEqual([
      '/assets/logos/logo_ensisa.svg',
      '/assets/logos/logo_iut_robert_schuman.png',
      '/assets/logos/logo_uqac.png',
    ]);
    expect(
      Array.from(page.querySelectorAll<HTMLImageElement>('.timeline-page__logo')).every(
        (logo) => logo.getAttribute('alt') === '',
      ),
    ).toBe(true);
    expect(page.querySelectorAll('.timeline-page__meta .timeline-page__logo').length).toBe(3);
    expect(page.querySelector('article.timeline-page__entry > a')).toBeNull();
  });

  it('renders education entries gracefully when an optional logo is absent', async () => {
    const fixture = await createFixture(
      'en',
      { applyStaticPage: vi.fn() },
      {
        ...portfolioContent.en,
        education: portfolioContent.en.education.map((entry) =>
          entry.id === 'ensisa' ? { ...entry, logo: undefined } : entry,
        ),
      },
    );

    const page = fixture.nativeElement as HTMLElement;
    const ensisaEntry = entryArticle(page, 'ENSISA');

    expect(ensisaEntry?.querySelector('.timeline-page__logo')).toBeNull();
    expect(ensisaEntry?.querySelector('.timeline-page__identity-name')?.textContent).toContain(
      'ENSISA',
    );
  });

  it('applies localized education metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('en', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('education', 'en');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
  contentOverride?: typeof portfolioContent.en,
): Promise<ComponentFixture<EducationPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [EducationPageComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          parent: {
            snapshot: {
              data: { locale },
            },
          },
        },
      },
      {
        provide: PageMetadataService,
        useValue: metadata,
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EducationPageComponent);

  if (contentOverride) {
    (fixture.componentInstance as unknown as { content: typeof portfolioContent.en }).content =
      contentOverride;
  }

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function timelineSide(entry: HTMLElement): 'start' | 'end' | 'none' {
  if (entry.classList.contains('timeline-start')) {
    return 'start';
  }

  return entry.classList.contains('timeline-end') ? 'end' : 'none';
}

function entryHeadings(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('article h2')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function entryArticle(page: HTMLElement, heading: string): HTMLElement | null {
  return (
    Array.from(page.querySelectorAll('article h2'))
      .find((element) => element.textContent?.trim() === heading)
      ?.closest('article') ?? null
  );
}

function imageSources(elements: readonly HTMLElement[]): (string | null)[] {
  return elements.map(
    (element) =>
      element.querySelector<HTMLImageElement>('img.timeline-page__logo')?.getAttribute('src') ??
      null,
  );
}
