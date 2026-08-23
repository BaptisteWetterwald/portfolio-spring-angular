import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
  it('renders the conservative public contact state without fake channels or forms', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Contact');
    expect(page.textContent).toContain('No public contact method is listed on this site yet.');
    expect(page.querySelector('form')).toBeNull();
    expect(page.querySelector('input')).toBeNull();
    expect(page.querySelector('textarea')).toBeNull();
    expect(page.querySelector('a')).toBeNull();
  });

  it('uses a daisyUI card foundation with a custom lighthouse visual', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.card.card-border.contact-page__panel')).not.toBeNull();
    expect(page.querySelector('.contact-page__beacon[aria-hidden="true"]')).not.toBeNull();
  });

  it('applies localized contact metadata', async () => {
    const metadata = { applyStaticPage: vi.fn() };

    await createFixture('fr', metadata);

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('contact', 'fr');
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
): Promise<ComponentFixture<ContactPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ContactPageComponent],
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

  const fixture = TestBed.createComponent(ContactPageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}
