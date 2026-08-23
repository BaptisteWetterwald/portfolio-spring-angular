import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { portfolioContentFor } from '../../core/content/portfolio-content';
import {
  SkillDomain,
  SkillGroup,
  SkillTechnology,
} from '../../core/content/portfolio-content.models';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { localizedPath, StaticPageId } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);
  readonly #metadata = inject(PageMetadataService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly content = portfolioContentFor(this.locale);

  constructor() {
    this.#localeContext.setLocale(this.locale);
    this.#metadata.applyStaticPage('home', this.locale);
  }

  protected localizedPath(pageId: StaticPageId): string {
    return localizedPath(this.locale, pageId);
  }

  protected skillGroupClass(group: SkillGroup): string {
    return `home-page__skill-group home-page__skill-group--${group.importance}`;
  }

  protected skillDomainClass(domain: SkillDomain): string {
    return `home-page__skill-domain home-page__skill-domain--${domain.importance}`;
  }

  protected skillTechnologyClass(technology: SkillTechnology): string {
    return technology.importance
      ? `home-page__skill home-page__skill--${technology.importance}`
      : 'home-page__skill';
  }
}
