import { TestBed } from '@angular/core/testing';

import { LocaleContextService } from './locale-context.service';
import { TranslationService } from './translation.service';
import { translations } from './translations';

describe('TranslationService', () => {
  it('keeps all three dictionaries complete with matching interpolation placeholders', () => {
    const keys = Object.keys(translations.en).sort();
    for (const locale of ['fr', 'en', 'hu'] as const) {
      expect(Object.keys(translations[locale]).sort()).toEqual(keys);
      for (const key of keys as (keyof typeof translations.en)[]) {
        const value = translations[locale][key];
        expect(value.trim()).not.toBe('');
        expect(value.match(/\{\w+\}/g)?.sort() ?? []).toEqual(
          translations.en[key].match(/\{\w+\}/g)?.sort() ?? [],
        );
      }
    }
  });
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

  it('keeps visible French project UI copy accented and natural', () => {
    expect(translations.fr['pages.projects.introduction']).toContain('sélection');
    expect(translations.fr['pages.projects.introduction']).toContain('académiques');
    expect(translations.fr['pages.projects.introduction']).toContain("j'ai travaillé");
    expect(translations.fr['projects.error.heading']).toContain('être chargés');
    expect(translations.fr['projects.links.details']).toBe('Voir le projet');
    expect(translations.fr['projects.status.PUBLISHED']).toBe('Publié');
    expect(translations.fr['projects.status.ARCHIVED']).toBe('Archivé');
    expect(translations.fr['metadata.experience.description']).toContain('développement logiciel');

    expect(Object.values(translations.fr).join('\n')).not.toMatch(
      /publies|apparaitront ici|etre charge|Voir le detail|Publie\b|software engineering/i,
    );
  });
});
