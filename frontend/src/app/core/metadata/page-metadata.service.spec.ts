import { TestBed } from '@angular/core/testing';

import { PageMetadataService, absoluteMediaUrl, absoluteUrl } from './page-metadata.service';

describe('PageMetadataService', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('[data-managed-by^="page-metadata-service"]')
      .forEach((element) => element.remove());
  });

  it('applies localized title, description, canonical, hreflang, and OpenGraph metadata', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('education', 'fr');

    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.title).toBe('Formation | Baptiste Wetterwald');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      "Formation de Baptiste Wetterwald : diplôme d'ingénieur en informatique et réseaux, semestre UQAC, DUT informatique, INSA Lyon et baccalauréat STI2D.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://bwetterwald.fr/fr/formation',
    );
    expect(
      document.querySelector('link[rel="alternate"][hreflang="fr"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/fr/formation');
    expect(
      document.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/en/education');
    expect(
      document.querySelector('link[rel="alternate"][hreflang="x-default"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://bwetterwald.fr/fr/formation',
    );
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      'fr_FR',
    );
    expect(
      document.querySelector('meta[property="og:locale:alternate"]')?.getAttribute('content'),
    ).toBe('en_US');
  });

  it('replaces managed alternate links on route changes', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('education', 'fr');
    metadata.applyStaticPage('projects', 'en');

    expect(
      document.querySelectorAll('link[data-managed-by="page-metadata-service:link"]').length,
    ).toBe(4);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://bwetterwald.fr/en/projects',
    );
  });

  it('marks not-found metadata as noindex without canonical alternates', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyProjectDetail('en', {
      slug: 'portfolio-api',
      title: 'Portfolio API',
      shortDescription: 'Public project API.',
      logoMediaRef: '/assets/projects/portfolio-api.png',
      availableLocales: ['en', 'fr'],
    });
    metadata.applyNotFound('fr', '/fr/inconnu?x=1');

    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.title).toBe('Page introuvable | Baptiste Wetterwald');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,follow',
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('link[rel="alternate"]')).toBeNull();
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'website',
    );
  });

  it('applies localized project detail metadata and available hreflang alternates', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyProjectDetail('en', {
      slug: 'portfolio-api',
      title: 'Portfolio API',
      shortDescription: 'Public project API.',
      logoMediaRef: '/assets/projects/portfolio-api.png',
      availableLocales: ['en', 'fr'],
    });

    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.title).toBe('Portfolio API | Baptiste Wetterwald');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Public project API.',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://bwetterwald.fr/en/projects/portfolio-api',
    );
    expect(
      document.querySelector('link[rel="alternate"][hreflang="fr"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/fr/projets/portfolio-api');
    expect(
      document.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/en/projects/portfolio-api');
    expect(document.querySelector('link[rel="alternate"][hreflang="x-default"]')).toBeNull();
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'article',
    );
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://bwetterwald.fr/assets/projects/portfolio-api.png',
    );
    expect(
      document.querySelector('meta[property="og:locale:alternate"]')?.getAttribute('content'),
    ).toBe('fr_FR');
  });

  it('omits project detail hreflang and OpenGraph alternates for unavailable translations', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyProjectDetail('en', {
      slug: 'english-only',
      title: 'English only',
      shortDescription: 'Only English is available.',
      availableLocales: ['en'],
    });

    expect(
      document.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute('href'),
    ).toBe('https://bwetterwald.fr/en/projects/english-only');
    expect(document.querySelector('link[rel="alternate"][hreflang="fr"]')).toBeNull();
    expect(document.querySelector('link[rel="alternate"][hreflang="x-default"]')).toBeNull();
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toBeNull();
  });

  it('marks temporary project failures as noindex and clears successful project links', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyProjectDetail('fr', {
      slug: 'portfolio-api',
      title: 'Portfolio API',
      shortDescription: 'API publique.',
      logoMediaRef: '/assets/projects/portfolio-api.png',
      availableLocales: ['fr', 'en'],
    });
    metadata.applyProjectUnavailable('en', '/en/projects/portfolio-api?retry=1');

    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.title).toBe('Project could not be loaded | Baptiste Wetterwald');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'The project API is temporarily unavailable.',
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,follow',
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('link[rel="alternate"]')).toBeNull();
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'website',
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://bwetterwald.fr/en/projects/portfolio-api',
    );
  });

  it('builds production absolute URLs', () => {
    expect(absoluteUrl('/en/projects')).toBe('https://bwetterwald.fr/en/projects');
    expect(absoluteMediaUrl('/assets/projects/logo.svg')).toBe(
      'https://bwetterwald.fr/assets/projects/logo.svg',
    );
    expect(absoluteMediaUrl('http://cdn.example.test/logo.svg')).toBeUndefined();
    expect(absoluteMediaUrl('//cdn.example.test/logo.svg')).toBeUndefined();
  });
});
