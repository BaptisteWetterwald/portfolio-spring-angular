import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

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

  it('applies localized experience metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('fr', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('experience', 'fr');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
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
  const headingElement = Array.from(page.querySelectorAll('article h2')).find(
    (element) => element.textContent?.trim() === heading,
  );

  return headingElement?.closest('article')?.textContent ?? '';
}
