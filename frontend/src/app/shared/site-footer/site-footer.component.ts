import {
  ChangeDetectionStrategy,
  Component,
  inject,
  makeStateKey,
  TransferState,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { portfolioPublicProfile } from '../../core/content/portfolio-content';
import { BrandIconComponent } from '../brand-icon/brand-icon.component';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { localizedPath, StaticPageId, staticPageIds } from '../../core/routing/localized-routes';

export const siteFooterYearStateKey = makeStateKey<number>('site-footer-current-year');

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, BrandIconComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly profile = portfolioPublicProfile;
  protected readonly navPages = staticPageIds;
  protected readonly currentYear = resolveCurrentYear(inject(TransferState));
  protected readonly locale = inject(LocaleContextService).locale;

  readonly #translations = inject(TranslationService);
  readonly #navigation = inject(PortfolioNavigationService);

  protected localizedPath(pageId: StaticPageId): string {
    return localizedPath(this.locale(), pageId);
  }

  protected sectionHref(pageId: StaticPageId): string {
    return this.#navigation.sectionHref(this.locale(), pageId);
  }

  protected isSectionActive(pageId: StaticPageId): boolean {
    return this.#navigation.isActive(pageId);
  }

  protected navigateToSection(event: MouseEvent, pageId: StaticPageId): void {
    this.#navigation.navigateToSection(event, this.locale(), pageId);
  }

  protected navLabel(pageId: StaticPageId): string {
    return this.#translations.translate(`nav.${pageId}`);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}

function resolveCurrentYear(transferState: TransferState): number {
  const transferredYear = transferState.get(siteFooterYearStateKey, 0);

  if (transferredYear > 0) {
    return transferredYear;
  }

  const currentYear = new Date().getFullYear();

  transferState.set(siteFooterYearStateKey, currentYear);

  return currentYear;
}
