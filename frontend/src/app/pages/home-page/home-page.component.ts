import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { portfolioContentFor } from '../../core/content/portfolio-content';
import {
  SkillDomain,
  SkillGroup,
  SkillTechnology,
} from '../../core/content/portfolio-content.models';
import { GitHubRepositoryActivityDto } from '../../core/github/github-activity.models';
import {
  githubActivityStateFromRouteData,
  githubActivityStateKey,
} from '../../core/github/github-activity.resolver';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { GitHubContributionCalendarComponent } from '../../shared/github-contribution-calendar/github-contribution-calendar.component';
import { SectionPermalinkComponent } from '../../shared/section-permalink/section-permalink.component';

@Component({
  selector: 'app-home-page',
  imports: [GitHubContributionCalendarComponent, SectionPermalinkComponent],
  templateUrl: './home-page.component.html',
  styleUrls: [
    './home-page.component.css',
    './home-page.instrument.css',
    './home-page.surfaces.css',
    './home-page.github.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly content = portfolioContentFor(this.locale);
  protected readonly githubActivity = (() => {
    const state = githubActivityStateFromRouteData(
      this.#route.snapshot?.data[githubActivityStateKey],
    );

    return state.kind === 'available' ? state.activity : null;
  })();

  constructor() {
    this.#localeContext.setLocale(this.locale);
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

  protected t(key: string): string {
    return this.#translations.translateFor(this.locale, key);
  }

  protected repositoryLinkAria(repository: GitHubRepositoryActivityDto): string {
    return `${repository.name} (${this.t('github.opensInNewTab')})`;
  }

  protected profileLinkAria(): string {
    return `${this.t('github.profileLink')} (${this.t('github.opensInNewTab')})`;
  }

  protected starsAria(stars: number): string {
    return `${this.t('github.stars')}: ${stars}`;
  }

  protected formatActivityDate(value: string): string {
    return new Intl.DateTimeFormat(this.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value));
  }
}
