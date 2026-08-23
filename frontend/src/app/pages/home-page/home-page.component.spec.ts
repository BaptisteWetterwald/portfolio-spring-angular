import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  it('renders the real English identity and primary positioning', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Baptiste Wetterwald');
    expect(page.textContent).toContain('Software Engineer');
    expect(page.textContent).toContain('Backend & Full-stack');
    expect(primaryStack(page)).toEqual([
      'Java / Spring',
      'C# / .NET',
      'TypeScript / Node.js',
      'Angular',
    ]);
  });

  it('renders the real French identity and equivalent positioning facts', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Baptiste Wetterwald');
    expect(page.textContent).toContain('Ingénieur logiciel');
    expect(page.textContent).toContain('Backend & full-stack');
    expect(page.textContent).toContain('Java / Spring');
    expect(page.textContent).toContain('C# / .NET');
    expect(page.textContent).toContain('TypeScript / Node.js');
    expect(page.textContent).toContain('Angular');
  });

  it('does not render fake social profile links or a fake portrait', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(page.querySelectorAll<HTMLAnchorElement>('a'));

    expect(page.querySelector('img')).toBeNull();
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('github'))).toBe(false);
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('linkedin'))).toBe(
      false,
    );
  });

  it('renders the approved skill groups without percentage metrics', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Software Engineering');
    expect(text).toContain('Microsoft / Enterprise Applications');
    expect(text).toContain('AI-assisted Engineering');
    expect(text).toContain('Data & Databases');
    expect(text).toContain('Engineering / Infrastructure');
    expect(text).toContain('PostgreSQL');
    expect(text).toContain('Spring Boot / PostgreSQL');
    expect(text).toContain('Codex / coding agents');
    expect(text).toContain('MCP concepts');
    expect(text).not.toMatch(/\b\d{1,3}%\b/);
    expect(text).not.toContain('PCF');
    expect(text).not.toContain('Custom Connectors');
    expect(text).not.toContain('AI Engineer');
    expect(text).not.toContain('ML Engineer');
    expect(text).not.toContain('LLM Engineer');
  });

  it('renders skill group importance hooks for the visible hierarchy', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const groups = Array.from(page.querySelectorAll<HTMLElement>('.home-page__skill-group'));

    expect(groups.map((group) => group.dataset['skillImportance'])).toEqual([
      'primary',
      'professional-complementary',
      'secondary',
      'professional-complementary',
      'secondary',
    ]);
    expect(groups[0].classList.contains('home-page__skill-group--primary')).toBe(true);
    expect(groups[2].classList.contains('home-page__skill-group--secondary')).toBe(true);
  });

  it('uses natural French labels for skill groups and AI-assisted tooling', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Développement logiciel');
    expect(text).toContain('Développement assisté par IA');
    expect(text).toContain('flux de travail de développement logiciel');
    expect(text).not.toContain('software engineering');
    expect(text).not.toContain('workflows');
  });

  it('applies localized home metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('fr', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('home', 'fr');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
): Promise<ComponentFixture<HomePageComponent>> {
  await TestBed.configureTestingModule({
    imports: [HomePageComponent],
    providers: [
      provideRouter([]),
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

  const fixture = TestBed.createComponent(HomePageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function primaryStack(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('.home-page__primary-stack li')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}
