import { Injectable, signal } from '@angular/core';

import { defaultLocale, SupportedLocale, toSupportedLocale } from './locales';

@Injectable({
  providedIn: 'root',
})
export class LocaleContextService {
  readonly #locale = signal<SupportedLocale>(defaultLocale);
  readonly locale = this.#locale.asReadonly();

  setLocale(value: string | null | undefined): SupportedLocale {
    const locale = toSupportedLocale(value) ?? defaultLocale;

    this.#locale.set(locale);

    return locale;
  }
}
