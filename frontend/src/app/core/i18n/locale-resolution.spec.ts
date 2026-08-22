import {
  readLocalePreferenceCookie,
  resolvePreferredLocale,
  selectLocaleFromAcceptLanguage,
  serializeLocalePreferenceCookie,
} from './locale-resolution';

describe('locale resolution', () => {
  it('uses a stored supported locale before Accept-Language', () => {
    expect(
      resolvePreferredLocale({
        storedPreference: 'fr',
        acceptLanguageHeader: 'en-US,en;q=0.9',
      }),
    ).toBe('fr');
  });

  it('resolves French from Accept-Language', () => {
    expect(selectLocaleFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
  });

  it('resolves English from Accept-Language', () => {
    expect(selectLocaleFromAcceptLanguage('en-US,en;q=0.9,fr;q=0.5')).toBe('en');
  });

  it('falls back to English for unsupported languages', () => {
    expect(resolvePreferredLocale({ acceptLanguageHeader: 'de-DE,es;q=0.9' })).toBe('en');
  });

  it('falls back to English when no preference exists', () => {
    expect(resolvePreferredLocale({})).toBe('en');
  });

  it('ignores invalid stored preferences', () => {
    expect(
      resolvePreferredLocale({
        storedPreference: 'de',
        acceptLanguageHeader: 'fr-FR,fr;q=0.9',
      }),
    ).toBe('fr');
  });

  it('reads the locale preference cookie', () => {
    expect(readLocalePreferenceCookie('other=1; portfolio_locale=fr; theme=dark')).toBe('fr');
  });

  it('serializes the locale preference cookie safely', () => {
    expect(serializeLocalePreferenceCookie('en')).toContain('portfolio_locale=en');
  });
});
