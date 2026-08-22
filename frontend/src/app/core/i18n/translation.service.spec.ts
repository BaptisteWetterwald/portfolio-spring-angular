import { TestBed } from '@angular/core/testing';

import { LocaleContextService } from './locale-context.service';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  it('looks up text for the current locale', () => {
    const localeContext = TestBed.inject(LocaleContextService);

    localeContext.setLocale('fr');

    expect(TestBed.inject(TranslationService).translate('nav.education')).toBe('Formation');
  });

  it('falls back safely when an invalid locale is selected', () => {
    const localeContext = TestBed.inject(LocaleContextService);

    localeContext.setLocale('de');

    expect(localeContext.locale()).toBe('en');
    expect(TestBed.inject(TranslationService).translate('nav.projects')).toBe('Projects');
  });

  it('returns a deliberate marker for missing keys', () => {
    expect(TestBed.inject(TranslationService).translate('missing.key')).toBe(
      '[missing translation: missing.key]',
    );
  });
});
