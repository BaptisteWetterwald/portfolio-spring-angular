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

  it('renders the provided portrait source without fake social profile links', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(page.querySelectorAll<HTMLAnchorElement>('a'));
    const portraitSlot = page.querySelector('[data-portrait-slot]');
    const portraitFrame = portraitSlot?.querySelector('.home-page__portrait-photo-frame');
    const portrait = portraitSlot?.querySelector('img');

    expect(portraitSlot).not.toBeNull();
    expect(portraitFrame).not.toBeNull();
    expect(portraitSlot?.querySelector('.home-page__portrait-ring')).toBeNull();
    expect(portrait?.getAttribute('src')).toBe('/assets/portrait/baptiste-wetterwald-portrait.png');
    expect(portrait?.getAttribute('alt')).toBe('Portrait of Baptiste Wetterwald');
    expect(portrait?.getAttribute('width')).toBe('4916');
    expect(portrait?.getAttribute('height')).toBe('7370');
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('github'))).toBe(false);
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('linkedin'))).toBe(
      false,
    );
  });

  it('localizes the portrait alternative text', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('[data-portrait-slot] img')?.getAttribute('alt')).toBe(
      'Portrait de Baptiste Wetterwald',
    );
  });

  it.each([
    ['en', 'Continue through the portfolio'],
    ['fr', 'Parcourir le portfolio'],
  ] as const)(
    'does not render the redundant %s portfolio navigation card section',
    async (locale, heading) => {
      const fixture = await createFixture(locale);
      const page = fixture.nativeElement as HTMLElement;
      const text = page.textContent ?? '';

      expect(text).not.toContain(heading);
      expect(text).not.toContain('Professional experience');
      expect(text).not.toContain('Parcours professionnel');
      expect(page.querySelector('.home-page__explore-link')).toBeNull();
    },
  );

  it('renders the approved skill groups without percentage metrics', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Software Engineering');
    expect(text).toContain('Data & Databases');
    expect(text).toContain('Enterprise & Industrial Software');
    expect(text).toContain('AI-assisted Engineering');
    expect(text).toContain('Broader Software Experience');
    expect(text).toContain('Exploratory & Historical');
    expect(text).toContain('Spring Boot');
    expect(text).toContain('OAuth 2.0');
    expect(text).toContain('Sockets');
    expect(text).toContain('SAP S/4HANA');
    expect(text).toContain('ABAP');
    expect(text).toContain('LabVIEW');
    expect(text).toContain('PostgreSQL');
    expect(text).toContain('Spring Boot / PostgreSQL');
    expect(text).toContain('Codex / coding agents');
    expect(text).toContain('MCP concepts');
    expect(skillBadgeLabels(page)).toContain('Sockets');
    expect(skillBadgeLabels(page)).not.toContain('sockets');
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
      'professional-complementary',
      'secondary',
      'secondary',
      'exploratory-historical',
    ]);
    expect(groups[0].classList.contains('home-page__skill-group--primary')).toBe(true);
    expect(groups[1].classList.contains('home-page__skill-group--professional-complementary')).toBe(
      true,
    );
    expect(groups[2].classList.contains('home-page__skill-group--professional-complementary')).toBe(
      true,
    );
    expect(groups[3].classList.contains('home-page__skill-group--secondary')).toBe(true);
    expect(groups[4].classList.contains('home-page__skill-group--secondary')).toBe(true);
    expect(groups[5].classList.contains('home-page__skill-group--exploratory-historical')).toBe(
      true,
    );
  });

  it('uses daisyUI primitives without fake navigation interactivity in skills', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.aura')).toBeNull();
    expect(page.querySelectorAll('.home-page__primary-stack .badge').length).toBe(4);
    expect(page.querySelectorAll('.home-page__skill-group.card').length).toBe(6);
    expect(page.querySelectorAll('.home-page__skill-badge.badge').length).toBeGreaterThan(0);
    expect(page.querySelector('.home-page__skill-group a')).toBeNull();
    expect(page.querySelector('.home-page__skill-group button')).toBeNull();
  });

  it('renders languages as factual secondary content without progress bars', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Languages');
    expect(text).toContain('French');
    expect(text).toContain('Native language');
    expect(text).toContain('English');
    expect(text).toContain('C1');
    expect(text).toContain('TOEIC 975');
    expect(text).toContain('German');
    expect(text).toContain('B1');
    expect(page.querySelectorAll('.home-page__language-card.card').length).toBe(3);
    expect(page.querySelector('progress')).toBeNull();
    expect(page.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('uses natural French labels for skill groups and AI-assisted tooling', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Développement logiciel');
    expect(text).toContain('Développement assisté par IA');
    expect(text).toContain('développement logiciel');
    expect(text).toContain('Langues');
    expect(text).toContain('Langue maternelle');
    expect(text).not.toContain('software engineering');
    expect(text).not.toContain('workflows');
  });

  it('exposes the stable home section anchor around the existing hero', async () => {
    const fixture = await createFixture('fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#home');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('home-title');
    expect(section?.querySelector('.home-page__hero')).toBeInstanceOf(HTMLElement);
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

function skillBadgeLabels(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('.home-page__skill-badge')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}
