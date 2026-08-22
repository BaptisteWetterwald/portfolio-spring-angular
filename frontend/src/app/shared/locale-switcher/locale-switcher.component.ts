import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { LocalePreferenceService } from '../../core/i18n/locale-preference.service';
import { SupportedLocale, supportedLocales } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { equivalentLocalizedPath } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-locale-switcher',
  imports: [RouterLink],
  templateUrl: './locale-switcher.component.html',
  styleUrl: './locale-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcherComponent {
  protected readonly locales = supportedLocales;
  protected readonly currentLocale = inject(LocaleContextService).locale;

  readonly #localePreference = inject(LocalePreferenceService);
  readonly #router = inject(Router);
  readonly #translations = inject(TranslationService);

  protected localePath(locale: SupportedLocale): string {
    return equivalentLocalizedPath(this.#router.url, locale);
  }

  protected localeLabel(locale: SupportedLocale): string {
    return this.#translations.translateFor(locale, `localeSwitcher.${locale}`);
  }

  protected localeAriaLabel(locale: SupportedLocale): string {
    return this.#translations.translate(`localeSwitcher.to${capitalizeLocale(locale)}`);
  }

  protected switchLocale(locale: SupportedLocale): void {
    this.#localePreference.persistLocaleChoice(locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}

function capitalizeLocale(locale: SupportedLocale): 'Fr' | 'En' {
  return locale === 'fr' ? 'Fr' : 'En';
}
