import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { localizedPath, StaticPageId, staticPageIds } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly navPages = staticPageIds;
  protected readonly exactPageCurrentOptions = { exact: true };
  protected readonly currentYear = new Date().getFullYear();
  protected readonly locale = inject(LocaleContextService).locale;

  readonly #translations = inject(TranslationService);

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
