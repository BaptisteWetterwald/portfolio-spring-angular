import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  it.each([
    ['fr', 'Ingénieur logiciel', 'Disponible à partir de décembre 2026', 'FR'],
    ['en', 'Software Engineer', 'Available from December 2026', 'EN'],
    ['hu', 'Szoftvermérnök', 'Munkakezdés 2026 decemberétől', 'EN'],
  ])(
    'offers localized recruitment information and real contact links in %s',
    async (locale, role, availability, cv) => {
      await TestBed.configureTestingModule({
        imports: [HomePageComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { parent: { snapshot: { data: { locale } } } } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(HomePageComponent);
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('h1')?.textContent).toContain('Baptiste Wetterwald');
      expect(page.textContent).toContain(role);
      expect(page.textContent).toContain(availability);
      expect(page.textContent).toContain('Budapest');
      expect(page.textContent).toContain('C1');
      expect(page.querySelector('a[download]')?.getAttribute('href')).toBe(
        `/assets/cv/cv-baptiste-wetterwald-${cv}.pdf`,
      );
      expect(
        page.querySelector('a[href="https://www.linkedin.com/in/baptiste-wetterwald/"]'),
      ).not.toBeNull();
      expect(page.querySelector('a[href^="mailto:"]')).toBeNull();
      expect(page.querySelectorAll('.home-page__primary-stack .badge')).toHaveLength(4);
      expect(page.querySelectorAll('.home-page__languages .badge')).toHaveLength(3);
      expect(page.querySelector('.home-page__languages')?.textContent).toContain('TOEIC 975');
      expect(page.querySelector('.home-page__languages')?.textContent).toContain('B1');
      expect(page.querySelectorAll('app-brand-icon')).toHaveLength(2);
      expect(page.querySelector(`a[href="/${locale}#contact"]`)).not.toBeNull();
      expect(page.querySelector('a[href^="tel:"]')).toBeNull();
      expect(page.querySelectorAll('[data-portfolio-section]')).toHaveLength(1);
      expect(page.querySelector('.home-page__skill-groups')).toBeNull();
      expect(page.querySelector('[data-github-activity]')).toBeNull();
      expect(page.querySelector('.home-page__portrait')?.getAttribute('fetchpriority')).toBe(
        'high',
      );
    },
  );
});
