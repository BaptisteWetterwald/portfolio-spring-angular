import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
  it('renders the conservative public contact state without fake channels or forms', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h2')?.textContent).toContain('Contact');
    expect(page.textContent).toContain('No public contact method is listed on this site yet.');
    expect(page.querySelector('form')).toBeNull();
    expect(page.querySelector('input')).toBeNull();
    expect(page.querySelector('textarea')).toBeNull();
    expect(page.querySelectorAll('a')).toHaveLength(1);
    expect(page.querySelector('a')?.hasAttribute('data-section-permalink')).toBe(true);
  });

  it('uses a daisyUI card foundation with a custom lighthouse visual', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.card.card-border.contact-page__panel')).not.toBeNull();
    expect(page.querySelector('.contact-page__beacon[aria-hidden="true"]')).not.toBeNull();
  });

  it('exposes the stable contact section anchor and heading relationship', async () => {
    const fixture = await createFixture('fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#contact');
    const permalink = section?.querySelector<HTMLAnchorElement>('[data-section-permalink]');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('contact-title');
    expect(section?.querySelector('h2')?.id).toBe('contact-title');
    expect(permalink?.getAttribute('href')).toBe('/fr#contact');
    expect(permalink?.getAttribute('aria-label')).toBe('Lien vers la section Contact');
    expect(permalink?.closest('h2')).toBeNull();
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
): Promise<ComponentFixture<ContactPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ContactPageComponent],
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

  const fixture = TestBed.createComponent(ContactPageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}
