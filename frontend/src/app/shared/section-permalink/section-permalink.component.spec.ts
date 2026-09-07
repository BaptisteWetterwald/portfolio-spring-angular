import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { StaticPageId } from '../../core/routing/localized-routes';
import { SectionPermalinkComponent } from './section-permalink.component';

describe('SectionPermalinkComponent', () => {
  const navigation = {
    navigateToSection: vi.fn((event: MouseEvent) => {
      event.preventDefault();
      return true;
    }),
    sectionHref: vi.fn((locale: string, sectionId: StaticPageId) => `/${locale}#${sectionId}`),
  };

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it.each([
    ['home', 'Link to Home section'],
    ['education', 'Link to Education section'],
    ['experience', 'Link to Experience section'],
    ['projects', 'Link to Projects section'],
    ['contact', 'Link to Contact section'],
  ] as const)('renders the English %s canonical permalink', async (sectionId, label) => {
    const fixture = await createFixture('en', sectionId);
    const link = permalink(fixture);

    expect(link.getAttribute('href')).toBe(`/en#${sectionId}`);
    expect(link.getAttribute('aria-label')).toBe(label);
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(link.querySelector('svg')?.getAttribute('focusable')).toBe('false');
  });

  it.each([
    ['home', 'Lien vers la section Accueil'],
    ['education', 'Lien vers la section Formation'],
    ['experience', 'Lien vers la section Expérience'],
    ['projects', 'Lien vers la section Projets'],
    ['contact', 'Lien vers la section Contact'],
  ] as const)('localizes the French %s accessible name', async (sectionId, label) => {
    const fixture = await createFixture('fr', sectionId);

    expect(permalink(fixture).getAttribute('aria-label')).toBe(label);
  });

  it('delegates explicit activation to the existing portfolio navigation service', async () => {
    const fixture = await createFixture('en', 'experience');
    const event = new MouseEvent('click', { bubbles: true, button: 0, cancelable: true });

    permalink(fixture).dispatchEvent(event);

    expect(navigation.navigateToSection).toHaveBeenCalledOnce();
    expect(navigation.navigateToSection).toHaveBeenCalledWith(event, 'en', 'experience');
  });

  async function createFixture(
    locale: 'fr' | 'en',
    sectionId: StaticPageId,
  ): Promise<ComponentFixture<SectionPermalinkComponent>> {
    await TestBed.configureTestingModule({
      imports: [SectionPermalinkComponent],
      providers: [{ provide: PortfolioNavigationService, useValue: navigation }],
    }).compileComponents();

    TestBed.inject(LocaleContextService).setLocale(locale);
    const fixture = TestBed.createComponent(SectionPermalinkComponent);

    fixture.componentRef.setInput('sectionId', sectionId);
    fixture.detectChanges();

    return fixture;
  }
});

function permalink(fixture: ComponentFixture<SectionPermalinkComponent>): HTMLAnchorElement {
  const link = (fixture.nativeElement as HTMLElement).querySelector('[data-section-permalink]');

  expect(link).toBeInstanceOf(HTMLAnchorElement);

  return link as HTMLAnchorElement;
}
