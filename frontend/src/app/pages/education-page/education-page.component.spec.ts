import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

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

  it('applies localized education metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('en', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('education', 'en');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
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
