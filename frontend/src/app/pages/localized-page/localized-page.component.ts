import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { StaticPageId, toStaticPageId } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-localized-page',
  templateUrl: './localized-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizedPageComponent {
  protected readonly pageId = signal<StaticPageId>('home');
  protected readonly heading = computed(() =>
    this.#translations.translate(`pages.${this.pageId()}.heading`),
  );
  protected readonly placeholder = computed(() =>
    this.#translations.translate(`pages.${this.pageId()}.placeholder`),
  );

  readonly #translations = inject(TranslationService);

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const metadata = inject(PageMetadataService);
    const locale = toSupportedLocale(route.parent?.snapshot.data['locale']) ?? defaultLocale;
    const pageId = toStaticPageId(route.snapshot.data['pageId']) ?? 'home';

    localeContext.setLocale(locale);
    this.pageId.set(pageId);
    metadata.applyStaticPage(pageId, locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
