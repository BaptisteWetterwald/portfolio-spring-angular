import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { portfolioContent } from '../../core/content/portfolio-content';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ExperiencePageComponent } from './experience-page.component';

describe('ExperiencePageComponent', () => {
  it('renders experience entries in reverse chronological order', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryIds(page)).toEqual([
      'plansee-group-functions',
      'plansee-internship',
      'bureau-veritas-laboratories',
      'groupe-ies',
      'lif-uqac-internship',
    ]);
    expect(entryHeadings(page)).toEqual([
      'Plansee Group Functions',
      'Plansee Group Functions',
      'Bureau Veritas Laboratories',
      'Groupe IES',
      'Laboratoire d’Informatique Formelle (LIF), UQAC',
    ]);
    expect(page.textContent).toContain('Software Developer');
    expect(page.textContent).toContain('Software Developer Intern');
    expect(page.textContent).toContain('Power Platform Developer Apprentice');
    expect(page.textContent).toContain('.NET Full-stack Developer Intern');
  });

  it('keeps Plansee current role and internship distinct with correct technology boundaries', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const employment = entryTextById(page, 'plansee-group-functions');
    const internship = entryTextById(page, 'plansee-internship');

    expect(employment).toContain('Since 1 December 2025');
    expect(employment).toContain('Planned end: end of November 2026');
    expect(employment).toContain('SAP S/4HANA');
    expect(employment).toContain('ABAP');
    expect(employment).toContain('Node.js');
    expect(employment).toContain('Express');
    expect(employment).toContain('OAuth 2.0');
    expect(employment).toContain('HTTP/API integration');
    expect(employment).toContain('powder-recipe calculations');
    expect(technologyLabelsByEntry(page, 'plansee-group-functions')).toEqual([
      'ABAP',
      'SAP S/4HANA',
      'Angular',
      'TypeScript',
      'Node.js',
      'Express',
      'REST',
      'OAuth 2.0',
      'C#',
      '.NET',
    ]);
    expect(technologyLabelsByEntry(page, 'plansee-group-functions')).not.toContain('HTTP');
    expect(internship).toContain('1 July 2025');
    expect(internship).toContain('mid-September 2025');
    expect(internship).toContain('11 weeks');
    expect(internship).toContain('Angular');
    expect(internship).toContain('TypeScript');
    expect(internship).toContain('without ABAP development');
    expect(internship).not.toContain('DaisyUI');
  });

  it('renders Bureau Veritas dates and Microsoft Power Platform technologies without unapproved additions', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const bureauVeritas = entryTextById(page, 'bureau-veritas-laboratories');

    expect(bureauVeritas).toContain('September 2023');
    expect(bureauVeritas).toContain('30 September 2025');
    expect(bureauVeritas).toContain('Microsoft Power Apps');
    expect(bureauVeritas).toContain('Power Automate');
    expect(bureauVeritas).toContain('Dataverse');
    expect(bureauVeritas).toContain('Microsoft Power Platform');
    expect(bureauVeritas).toContain('without internal technical Power Platform mentorship');
    expect(bureauVeritas).not.toContain('PCF');
    expect(bureauVeritas).not.toContain('Custom Connectors');
  });

  it('keeps the Experience card header compact and details in a full-width section', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const plansee = entryArticleById(page, 'plansee-group-functions');
    const bureauVeritas = entryArticleById(page, 'bureau-veritas-laboratories');

    expect(plansee?.querySelector('.timeline-page__meta')).not.toBeNull();
    expect(plansee?.querySelector('.timeline-page__identity-panel h3')?.textContent).toContain(
      'Plansee Group Functions',
    );
    expect(plansee?.querySelector('.timeline-page__identity-panel .timeline-page__role')).not.toBe(
      null,
    );
    expect(
      plansee?.querySelector('.timeline-page__identity-panel .timeline-page__location'),
    ).not.toBeNull();

    const planseeDetails = plansee?.querySelector('.timeline-page__details');

    expect(planseeDetails?.querySelector('.timeline-page__context')).not.toBeNull();
    expect(planseeDetails?.querySelectorAll('.timeline-page__responsibilities li').length).toBe(4);
    expect(planseeDetails?.querySelector('.timeline-page__technologies')).not.toBeNull();
    expect(
      plansee?.querySelector('.timeline-page__identity-panel .timeline-page__technologies'),
    ).toBeNull();

    const bureauDetails = bureauVeritas?.querySelector('.timeline-page__details');

    expect(bureauDetails?.querySelector('.timeline-page__context')).not.toBeNull();
    expect(bureauDetails?.querySelectorAll('.timeline-page__responsibilities li').length).toBe(3);
    expect(bureauDetails?.querySelectorAll('.timeline-page__technology.badge').length).toBe(4);
  });

  it('renders responsibilities as semantic, distinct list items for every experience entry', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(
      [
        'plansee-group-functions',
        'plansee-internship',
        'bureau-veritas-laboratories',
        'groupe-ies',
        'lif-uqac-internship',
      ].map((id) => responsibilityTextsByEntry(page, id).length),
    ).toEqual([4, 2, 3, 3, 2]);

    const planseeResponsibilities = responsibilityTextsByEntry(page, 'plansee-group-functions');

    expect(planseeResponsibilities[0]).toContain('Angular application');
    expect(planseeResponsibilities[1]).toContain('SAP S/4HANA');
    expect(planseeResponsibilities[1]).toContain('HTTP/API integration');
    expect(planseeResponsibilities[2]).toContain('C#/.NET industrial measurement application');
    expect(planseeResponsibilities[3]).toContain('Node.js/Express middleware');
  });

  it('renders Groupe IES and LIF internship details with supplied logos', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const groupeIes = entryArticleById(page, 'groupe-ies');
    const lif = entryArticleById(page, 'lif-uqac-internship');

    expect(groupeIes?.textContent).toContain('July 2023');
    expect(groupeIes?.textContent).toContain('August 2023');
    expect(groupeIes?.textContent).toContain('2 months');
    expect(groupeIes?.textContent).toContain('ASP.NET Blazor');
    expect(groupeIes?.textContent).toContain('VB.NET');
    expect(groupeIes?.querySelector<HTMLImageElement>('.timeline-page__logo')?.src).toContain(
      '/assets/logos/logo_groupe_ies.jpeg',
    );

    expect(lif?.textContent).toContain('approximately April 2022');
    expect(lif?.textContent).toContain('July 2022');
    expect(lif?.textContent).toContain('approximately 3 months');
    expect(lif?.textContent).toContain('BeamNG.drive');
    expect(lif?.textContent).toContain('BeepBeep 3');
    expect(technologyLabelsByEntry(page, 'lif-uqac-internship')).toContain('Sockets');
    expect(technologyLabelsByEntry(page, 'lif-uqac-internship')).not.toContain('sockets');
    expect(lif?.querySelector<HTMLImageElement>('.timeline-page__logo')?.src).toContain(
      '/assets/logos/logo_lif.png',
    );
    expect(lif?.querySelector('a.timeline-page__identity-link')).toBeNull();
    expect(lif?.querySelector('a.timeline-page__logo-link')).toBeNull();
  });

  it('renders localized French experience content with the same factual entries', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(entryIds(page)).toEqual([
      'plansee-group-functions',
      'plansee-internship',
      'bureau-veritas-laboratories',
      'groupe-ies',
      'lif-uqac-internship',
    ]);
    expect(entryHeadings(page)).toEqual([
      'Plansee Group Functions',
      'Plansee Group Functions',
      'Bureau Veritas Laboratoires',
      'Groupe IES',
      'Laboratoire d’Informatique Formelle (LIF), UQAC',
    ]);
    expect(page.textContent).toContain('Alternant Développeur Power Platform');
    expect(page.textContent).toContain('sans développement ABAP');
    expect(page.textContent).toContain('environ 3 mois');
  });

  it('uses semantic time elements for confirmed experience periods', async () => {
    const fixture = await createFixture('en');
    const times = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTimeElement>('time'),
    );

    expect(times.map((time) => time.getAttribute('datetime'))).toEqual([
      '2025-12-01',
      '2025-07-01',
      '2025-09',
      '2023-09',
      '2025-09-30',
      '2023-07',
      '2023-08',
      '2022-04',
      '2022-07',
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
    expect(entryIds(page)).toEqual([
      'plansee-group-functions',
      'plansee-internship',
      'bureau-veritas-laboratories',
      'groupe-ies',
      'lif-uqac-internship',
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
    ]);
    expect(links.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(links.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(links[0].getAttribute('aria-label')).toContain('Official website');
    expect(links.every((link) => link.closest('h3'))).toBe(true);
    expect(links.every((link) => link.querySelector('.timeline-page__logo-frame'))).toBe(false);
    expect(logoLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://plansee-group.com/en',
      'https://www.plansee.com/',
      'https://www.bureauveritas.fr/',
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
    ]);
    expect(
      Array.from(page.querySelectorAll<HTMLImageElement>('.timeline-page__logo')).every(
        (logo) => logo.getAttribute('alt') === '',
      ),
    ).toBe(true);
    expect(page.querySelectorAll('.timeline-page__meta .timeline-page__logo').length).toBe(5);
    expect(
      entryArticleById(page, 'groupe-ies')?.querySelector('a.timeline-page__identity-link'),
    ).toBeNull();
    expect(
      entryArticleById(page, 'groupe-ies')
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
    const groupeIesEntry = entryArticleById(page, 'groupe-ies');

    expect(groupeIesEntry?.querySelector('.timeline-page__logo')).toBeNull();
    expect(groupeIesEntry?.querySelector('.timeline-page__identity-name')?.textContent).toContain(
      'Groupe IES',
    );
  });

  it('exposes the stable experience section anchor and heading relationship', async () => {
    const fixture = await createFixture('fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#experience');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('experience-title');
    expect(section?.querySelector('h2')?.id).toBe('experience-title');
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

function entryIds(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll<HTMLElement>('article.timeline-page__entry')).map(
    (entry) => entry.dataset['timelineEntryId'] ?? '',
  );
}

function entryHeadings(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('article .timeline-page__identity-panel h3')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function entryTextById(page: HTMLElement, id: string): string {
  return entryArticleById(page, id)?.textContent ?? '';
}

function responsibilityTextsByEntry(page: HTMLElement, id: string): string[] {
  return Array.from(
    entryArticleById(page, id)?.querySelectorAll<HTMLElement>(
      'ul.timeline-page__responsibilities > li',
    ) ?? [],
  ).map((item) => item.textContent?.trim() ?? '');
}

function technologyLabelsByEntry(page: HTMLElement, id: string): string[] {
  return Array.from(
    entryArticleById(page, id)?.querySelectorAll<HTMLElement>('.timeline-page__technology') ?? [],
  ).map((technology) => technology.textContent?.trim() ?? '');
}

function timelineSide(entry: HTMLElement): 'start' | 'end' | 'none' {
  if (entry.classList.contains('timeline-start')) {
    return 'start';
  }

  return entry.classList.contains('timeline-end') ? 'end' : 'none';
}

function entryArticleById(page: HTMLElement, id: string): HTMLElement | null {
  return page.querySelector<HTMLElement>(
    `article.timeline-page__entry[data-timeline-entry-id="${id}"]`,
  );
}

function imageSources(elements: readonly HTMLElement[]): (string | null)[] {
  return elements.map(
    (element) =>
      element.querySelector<HTMLImageElement>('img.timeline-page__logo')?.getAttribute('src') ??
      null,
  );
}
