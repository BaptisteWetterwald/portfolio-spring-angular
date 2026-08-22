import {
  equivalentLocalizedPath,
  localizedAlternates,
  localizedSegment,
  localizedStaticRouteSegments,
  localizedPath,
  localizedProjectDetailAlternates,
  localizedProjectDetailPath,
  matchLocalizedPath,
  staticPageIds,
} from './localized-routes';

describe('localized route model', () => {
  it('creates canonical localized static paths', () => {
    expect(localizedPath('fr', 'education')).toBe('/fr/formation');
    expect(localizedPath('en', 'projects')).toBe('/en/projects');
  });

  it('derives localized paths from the route segment model', () => {
    for (const pageId of staticPageIds) {
      for (const locale of ['fr', 'en'] as const) {
        const segment = localizedStaticRouteSegments[pageId][locale];
        const expectedPath = segment ? `/${locale}/${segment}` : `/${locale}`;

        expect(localizedSegment(locale, pageId)).toBe(segment);
        expect(localizedPath(locale, pageId)).toBe(expectedPath);
      }
    }
  });

  it('matches localized route aliases to shared page ids', () => {
    expect(matchLocalizedPath('/fr/formation')).toEqual({
      locale: 'fr',
      pageId: 'education',
    });
    expect(matchLocalizedPath('/en/education')).toEqual({
      locale: 'en',
      pageId: 'education',
    });
  });

  it('does not match unsupported locale prefixes', () => {
    expect(matchLocalizedPath('/de')).toBeUndefined();
    expect(matchLocalizedPath('/es/projects')).toBeUndefined();
  });

  it('maps equivalent static routes between locales', () => {
    expect(equivalentLocalizedPath('/fr/formation', 'en')).toBe('/en/education');
    expect(equivalentLocalizedPath('/en/projects', 'fr')).toBe('/fr/projets');
    expect(equivalentLocalizedPath('/fr/contact', 'en')).toBe('/en/contact');
  });

  it('keeps V1 project slugs shared when switching locales', () => {
    expect(localizedProjectDetailPath('fr', 'portfolio-spring-angular')).toBe(
      '/fr/projets/portfolio-spring-angular',
    );
    expect(equivalentLocalizedPath('/fr/projets/portfolio-spring-angular', 'en')).toBe(
      '/en/projects/portfolio-spring-angular',
    );
    expect(
      equivalentLocalizedPath('/en/projects/portfolio-spring-angular', 'fr', ['fr', 'en']),
    ).toBe('/fr/projets/portfolio-spring-angular');
  });

  it('uses the projects index when project detail translation is known unavailable', () => {
    expect(equivalentLocalizedPath('/en/projects/english-only', 'fr', ['en'])).toBe('/fr/projets');
  });

  it('falls back to the selected locale home for unknown routes', () => {
    expect(equivalentLocalizedPath('/unknown/path', 'fr')).toBe('/fr');
  });

  it('returns hreflang alternate paths for equivalent pages', () => {
    expect(localizedAlternates('projects')).toEqual({
      fr: '/fr/projets',
      en: '/en/projects',
    });
    expect(localizedProjectDetailAlternates('portfolio-spring-angular', ['fr'])).toEqual({
      fr: '/fr/projets/portfolio-spring-angular',
    });
  });
});
