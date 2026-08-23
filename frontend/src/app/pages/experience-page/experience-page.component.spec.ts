import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { portfolioContent } from '../../core/content/portfolio-content';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ExperiencePageComponent } from './experience-page.component';

describe('ExperiencePageComponent', () => {
  it('renders confirmed experience entries in reverse chronological order', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryHeadings(page)).toEqual([
      'Plansee Group Functions',
      'Plansee',
      'Bureau Veritas Laboratories',
      'Groupe IES',
      'UQAC',
    ]);
    expect(page.textContent).toContain('Software Developer');
    expect(page.textContent).toContain('Software Engineering Internship');
    expect(page.textContent).toContain('Power Platform Developer Apprentice');
    expect(page.textContent).toContain('Full Stack .NET Developer Intern');
    expect(page.textContent).toContain('Software Developer Intern');
  });

  it('keeps Plansee internship and employment distinct with only confirmed internship technologies', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const employment = entryText(page, 'Plansee Group Functions');
    const internship = entryText(page, 'Plansee');

    expect(employment).toContain('planned end');
    expect(employment).not.toContain('Angular');
    expect(employment).not.toContain('DaisyUI');
    expect(internship).toContain('11 weeks');
    expect(internship).toContain('Angular');
    expect(internship).toContain('DaisyUI');
    expect(internship).toContain('did not include ABAP development');
  });

  it('renders Bureau Veritas Microsoft ecosystem technologies without unconfirmed additions', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const bureauVeritas = entryText(page, 'Bureau Veritas Laboratories');

    expect(bureauVeritas).toContain('Power Platform');
    expect(bureauVeritas).toContain('Power Apps');
    expect(bureauVeritas).toContain('Power Automate');
    expect(bureauVeritas).toContain('Dataverse');
    expect(bureauVeritas).toContain('Microsoft 365');
    expect(bureauVeritas).not.toContain('PCF');
    expect(bureauVeritas).not.toContain('Custom Connectors');
  });

  it('renders localized French experience content with the same factual entries', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryHeadings(page)).toEqual([
      'Plansee Group Functions',
      'Plansee',
      'Bureau Veritas Laboratoires',
      'Groupe IES',
      'UQAC',
    ]);
    expect(page.textContent).toContain('Apprenti développeur Power Platform');
    expect(page.textContent).toContain('sans développement ABAP');
  });

  it('uses semantic time elements for confirmed experience periods', async () => {
    const fixture = await createFixture('en');
    const times = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTimeElement>('time'),
    );

    expect(times.map((time) => time.getAttribute('datetime'))).toEqual([
      '2025-12',
      '2026-11',
      '2025',
      '2023',
      '2025',
      '2023',
      '2022',
    ]);
  });

  it('uses a daisyUI timeline foundation while preserving entry order and technology labels', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const timeline = page.querySelector('ol.timeline.timeline-vertical');
    const entries = Array.from(page.querySelectorAll<HTMLElement>('article.timeline-page__entry'));

    expect(timeline).not.toBeNull();
    expect(timeline?.classList.contains('timeline-snap-icon')).toBe(true);
    expect(timeline?.classList.contains('max-md:timeline-compact')).toBe(true);
    expect(page.querySelectorAll('.timeline-page__waypoint[aria-hidden="true"]').length).toBe(5);
    expect(page.querySelectorAll('hr.timeline-page__route-line').length).toBe(8);
    expect(entries.map((entry) => timelineSide(entry))).toEqual([
      'start',
      'end',
      'start',
      'end',
      'start',
    ]);
    expect(entryHeadings(page)).toEqual([
      'Plansee Group Functions',
      'Plansee',
      'Bureau Veritas Laboratories',
      'Groupe IES',
      'UQAC',
    ]);
    expect(page.querySelectorAll('.timeline-page__technology.badge').length).toBeGreaterThan(0);
  });

  it('links only the organization name and metadata logo areas when an official website is available', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('a.timeline-page__identity-link'),
    );
    const logoLinks = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('a.timeline-page__logo-link'),
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://plansee-group.com/en',
      'https://www.plansee.com/',
      'https://www.bureauveritas.fr/',
      'https://www.uqac.ca/',
    ]);
    expect(links.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(links.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(links[0].getAttribute('aria-label')).toContain('Official website');
    expect(links.every((link) => link.closest('h2'))).toBe(true);
    expect(links.every((link) => link.querySelector('.timeline-page__logo-frame'))).toBe(false);
    expect(logoLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://plansee-group.com/en',
      'https://www.plansee.com/',
      'https://www.bureauveritas.fr/',
      'https://www.uqac.ca/',
    ]);
    expect(logoLinks.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(logoLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
      true,
    );
    expect(logoLinks[0].getAttribute('aria-label')).toContain('logo - Official website');
    expect(logoLinks.every((link) => link.closest('.timeline-page__meta'))).toBe(true);
    expect(imageSources(logoLinks)).toEqual([
      '/assets/logos/logo_plansee.png',
      '/assets/logos/logo_plansee.png',
      '/assets/logos/logo_bureau_veritas.svg',
      '/assets/logos/logo_uqac.png',
    ]);
    expect(
      Array.from(page.querySelectorAll<HTMLImageElement>('.timeline-page__logo')).every(
        (logo) => logo.getAttribute('alt') === '',
      ),
    ).toBe(true);
    expect(page.querySelectorAll('.timeline-page__meta .timeline-page__logo').length).toBe(5);
    expect(entryText(page, 'Groupe IES')).toContain('Full Stack .NET Developer Intern');
    expect(
      entryArticle(page, 'Groupe IES')?.querySelector('a.timeline-page__identity-link'),
    ).toBeNull();
    expect(
      entryArticle(page, 'Groupe IES')
        ?.querySelector<HTMLImageElement>('.timeline-page__meta img.timeline-page__logo')
        ?.getAttribute('src'),
    ).toBe('/assets/logos/logo_groupe_ies.jpeg');
    expect(page.querySelector('article.timeline-page__entry > a')).toBeNull();
  });

  it('renders experience entries gracefully when an optional logo is absent', async () => {
    const fixture = await createFixture(
      'en',
      { applyStaticPage: vi.fn() },
      {
        ...portfolioContent.en,
        experience: portfolioContent.en.experience.map((entry) =>
          entry.id === 'groupe-ies' ? { ...entry, logo: undefined } : entry,
        ),
      },
    );

    const page = fixture.nativeElement as HTMLElement;
    const groupeIesEntry = entryArticle(page, 'Groupe IES');

    expect(groupeIesEntry?.querySelector('.timeline-page__logo')).toBeNull();
    expect(groupeIesEntry?.querySelector('.timeline-page__identity-name')?.textContent).toContain(
      'Groupe IES',
    );
  });

  it('applies localized experience metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('fr', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('experience', 'fr');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
  contentOverride?: typeof portfolioContent.en,
): Promise<ComponentFixture<ExperiencePageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ExperiencePageComponent],
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

  const fixture = TestBed.createComponent(ExperiencePageComponent);

  if (contentOverride) {
    (fixture.componentInstance as unknown as { content: typeof portfolioContent.en }).content =
      contentOverride;
  }

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function entryHeadings(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('article h2')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function entryText(page: HTMLElement, heading: string): string {
  return entryArticle(page, heading)?.textContent ?? '';
}

function timelineSide(entry: HTMLElement): 'start' | 'end' | 'none' {
  if (entry.classList.contains('timeline-start')) {
    return 'start';
  }

  return entry.classList.contains('timeline-end') ? 'end' : 'none';
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
