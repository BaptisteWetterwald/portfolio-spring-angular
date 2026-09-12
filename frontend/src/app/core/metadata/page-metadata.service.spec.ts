import { TestBed } from '@angular/core/testing';

import {
  PageMetadataService,
  absoluteMediaUrl,
  absoluteUrl,
  serializeJsonLd,
} from './page-metadata.service';

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

  it('emits the exact French ProfilePage and Person structured data', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('home', 'fr');

    expect(parsedManagedStructuredData()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://bwetterwald.fr/fr#profile-page',
      url: 'https://bwetterwald.fr/fr',
      inLanguage: 'fr',
      mainEntity: {
        '@type': 'Person',
        '@id': 'https://bwetterwald.fr/#person',
        name: 'Baptiste Wetterwald',
        description:
          'Baptiste Wetterwald, ingénieur logiciel orienté backend et full-stack autour de Java, Spring, .NET, TypeScript, Node.js et Angular.',
        jobTitle: 'Ingénieur logiciel',
        image: 'https://bwetterwald.fr/assets/portrait/baptiste-wetterwald-portrait.png',
        sameAs: ['https://github.com/BaptisteWetterwald'],
      },
    });
  });

  it('emits the exact English ProfilePage and Person structured data', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('home', 'en');

    expect(parsedManagedStructuredData()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://bwetterwald.fr/en#profile-page',
      url: 'https://bwetterwald.fr/en',
      inLanguage: 'en',
      mainEntity: {
        '@type': 'Person',
        '@id': 'https://bwetterwald.fr/#person',
        name: 'Baptiste Wetterwald',
        description:
          'Baptiste Wetterwald, Software Engineer focused on backend and full-stack development with Java, Spring, .NET, TypeScript, Node.js, and Angular.',
        jobTitle: 'Software Engineer',
        image: 'https://bwetterwald.fr/assets/portrait/baptiste-wetterwald-portrait.png',
        sameAs: ['https://github.com/BaptisteWetterwald'],
      },
    });
  });

  it('replaces the localized ProfilePage while retaining the shared Person identity', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('home', 'fr');
    const french = parsedManagedStructuredData();
    metadata.applyStaticPage('home', 'en');
    const english = parsedManagedStructuredData();

    expect(managedStructuredDataScripts()).toHaveLength(1);
    expect(french['@id']).toBe('https://bwetterwald.fr/fr#profile-page');
    expect(english['@id']).toBe('https://bwetterwald.fr/en#profile-page');
    expect(personFrom(french)['@id']).toBe('https://bwetterwald.fr/#person');
    expect(personFrom(english)['@id']).toBe('https://bwetterwald.fr/#person');
  });

  it('removes ProfilePage structured data for project details and unavailable page states', () => {
    const metadata = TestBed.inject(PageMetadataService);

    metadata.applyStaticPage('home', 'en');
    metadata.applyProjectDetail('en', {
      slug: 'portfolio-api',
      title: 'Portfolio API',
      shortDescription: 'Public project API.',
      availableLocales: ['en', 'fr'],
    });
    expect(managedStructuredDataScripts()).toHaveLength(0);

    metadata.applyStaticPage('home', 'fr');
    metadata.applyNotFound('fr', '/fr/inconnu');
    expect(managedStructuredDataScripts()).toHaveLength(0);

    metadata.applyStaticPage('home', 'en');
    metadata.applyProjectUnavailable('en', '/en/projects/portfolio-api');
    expect(managedStructuredDataScripts()).toHaveLength(0);
  });

  it('serializes JSON-LD without leaving script terminators or markup-significant characters', () => {
    const hostile = '</script><tag>&\u2028\u2029';
    const serialized = serializeJsonLd({ value: hostile });

    expect(serialized).toBe(
      '{"value":"\\u003C/script\\u003E\\u003Ctag\\u003E\\u0026\\u2028\\u2029"}',
    );
    expect(serialized).not.toContain('</script>');
    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).not.toContain('&');
    expect(serialized).not.toContain('\u2028');
    expect(serialized).not.toContain('\u2029');
    expect(JSON.parse(serialized)).toEqual({ value: hostile });
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

function managedStructuredDataScripts(): NodeListOf<HTMLScriptElement> {
  return document.querySelectorAll(
    'script[type="application/ld+json"][data-managed-by="page-metadata-service:structured-data"]',
  );
}

function parsedManagedStructuredData(): Record<string, unknown> {
  const scripts = managedStructuredDataScripts();

  expect(scripts).toHaveLength(1);

  return JSON.parse(scripts[0]!.textContent ?? '') as Record<string, unknown>;
}

function personFrom(profilePage: Record<string, unknown>): Record<string, unknown> {
  return profilePage['mainEntity'] as Record<string, unknown>;
}
