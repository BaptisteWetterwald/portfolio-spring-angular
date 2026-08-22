import { inject, Injectable } from '@angular/core';

import { defaultLocale, toSupportedLocale } from './locales';
import { LocaleContextService } from './locale-context.service';
import { TranslationKey, translations } from './translations';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  readonly #localeContext = inject(LocaleContextService);
  readonly locale = this.#localeContext.locale;

  translate(key: TranslationKey | string): string {
    return this.translateFor(this.locale(), key);
  }

  translateFor(locale: string | null | undefined, key: TranslationKey | string): string {
    const supportedLocale = toSupportedLocale(locale) ?? defaultLocale;
    const translation =
      translations[supportedLocale][key as TranslationKey] ??
      translations[defaultLocale][key as TranslationKey];

    return translation ?? `[missing translation: ${key}]`;
  }
}
