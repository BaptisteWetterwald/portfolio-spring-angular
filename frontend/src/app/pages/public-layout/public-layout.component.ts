import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { SupportedLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { localizedPath, StaticPageId, staticPageIds } from '../../core/routing/localized-routes';
import { LocaleSwitcherComponent } from '../../shared/locale-switcher/locale-switcher.component';

@Component({
  selector: 'app-public-layout',
  imports: [LocaleSwitcherComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  protected readonly navPages = staticPageIds;
  protected readonly exactPageCurrentOptions = { exact: true };
  protected readonly locale: () => SupportedLocale;

  readonly #translations = inject(TranslationService);

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const locale = toSupportedLocale(route.snapshot.data['locale']);

    localeContext.setLocale(locale);
    this.locale = localeContext.locale;
  }

  protected localizedPath(pageId: StaticPageId): string {
    return localizedPath(this.locale(), pageId);
  }

  protected navLabel(pageId: StaticPageId): string {
    return this.#translations.translate(`nav.${pageId}`);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
