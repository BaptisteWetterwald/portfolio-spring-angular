import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RESPONSE_INIT } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { LocalePreferenceService } from '../../core/i18n/locale-preference.service';
import { SupportedLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { localizedPath } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {
  protected readonly locale: () => SupportedLocale;
  protected readonly homePath = computed(() => localizedPath(this.locale(), 'home'));

  readonly #translations = inject(TranslationService);

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const localeContext = inject(LocaleContextService);
    const localePreference = inject(LocalePreferenceService);
    const metadata = inject(PageMetadataService);
    const responseInit = inject(RESPONSE_INIT, { optional: true });
    const routeLocale = toSupportedLocale(route.parent?.snapshot.data['locale']);
    const locale = routeLocale ?? localePreference.resolveEntryLocale();

    localeContext.setLocale(locale);
    this.locale = localeContext.locale;
    metadata.applyNotFound(locale, router.url);

    if (responseInit) {
      responseInit.status = 404;
    }
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
