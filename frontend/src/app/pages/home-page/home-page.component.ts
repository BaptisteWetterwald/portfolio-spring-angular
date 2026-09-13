import { BrandIconComponent } from '../../shared/brand-icon/brand-icon.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { portfolioContentFor, portfolioPublicProfile } from '../../core/content/portfolio-content';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { SectionPermalinkComponent } from '../../shared/section-permalink/section-permalink.component';

@Component({
  selector: 'app-home-page',
  imports: [BrandIconComponent, SectionPermalinkComponent],
  templateUrl: './home-page.component.html',
  styleUrls: [
    './home-page.component.css',
    './home-page.instrument.css',
    './home-page.surfaces.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly navigation = inject(PortfolioNavigationService);
  protected readonly locale =
    toSupportedLocale(inject(ActivatedRoute).parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly content = portfolioContentFor(this.locale);
  protected readonly profile = portfolioPublicProfile;
  protected readonly cvPath =
    this.locale === 'fr'
      ? '/assets/cv/cv-baptiste-wetterwald-FR.pdf'
      : '/assets/cv/cv-baptiste-wetterwald-EN.pdf';
  readonly #translations = inject(TranslationService);

  constructor() {
    inject(LocaleContextService).setLocale(this.locale);
  }
  protected t(key: string): string {
    return this.#translations.translateFor(this.locale, key);
  }
}
