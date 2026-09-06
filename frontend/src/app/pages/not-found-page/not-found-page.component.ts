import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RESPONSE_INIT } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, UrlTree } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { LocalePreferenceService } from '../../core/i18n/locale-preference.service';
import { SupportedLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import {
  localizedPath,
  localizedPortfolioSectionUrl,
  matchLocalizedPath,
} from '../../core/routing/localized-routes';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {
  protected readonly locale: () => SupportedLocale;
  protected recoveryPath: string | UrlTree = '/en';
  protected recoveryLabelKey = 'pages.notFound.homeLink';

  readonly #translations = inject(TranslationService);

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const localeContext = inject(LocaleContextService);
    const localePreference = inject(LocalePreferenceService);
    const metadata = inject(PageMetadataService);
    const navigation = inject(PortfolioNavigationService);
    const responseInit = inject(RESPONSE_INIT, { optional: true });
    const routeLocale = toSupportedLocale(route.parent?.snapshot.data['locale']);
    const locale = routeLocale ?? localePreference.resolveEntryLocale();
    const isProjectDetailRoute = matchLocalizedPath(router.url)?.pageId === 'projectDetail';

    localeContext.setLocale(locale);
    navigation.setActiveSection(null);
    this.locale = localeContext.locale;
    this.recoveryPath = router.parseUrl(
      isProjectDetailRoute
        ? localizedPortfolioSectionUrl(locale, 'projects')
        : localizedPath(locale, 'home'),
    );
    this.recoveryLabelKey = isProjectDetailRoute
      ? 'projects.backToProjects'
      : 'pages.notFound.homeLink';
    metadata.applyNotFound(locale, router.url);

    if (responseInit) {
      responseInit.status = 404;
    }
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
