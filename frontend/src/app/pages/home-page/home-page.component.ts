import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { portfolioContentFor } from '../../core/content/portfolio-content';
import {
  SkillDomain,
  SkillGroup,
  SkillTechnology,
} from '../../core/content/portfolio-content.models';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: [
    './home-page.component.css',
    './home-page.instrument.css',
    './home-page.surfaces.css',
  ],
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

  protected skillGroupClass(group: SkillGroup): string {
    return `card card-border home-page__skill-group home-page__skill-group--${group.importance}`;
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
