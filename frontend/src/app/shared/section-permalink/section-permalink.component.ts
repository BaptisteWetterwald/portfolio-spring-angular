import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { TranslationKey } from '../../core/i18n/translations';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { StaticPageId } from '../../core/routing/localized-routes';

const permalinkTranslationKeys = {
  home: 'sectionPermalink.home',
  education: 'sectionPermalink.education',
  experience: 'sectionPermalink.experience',
  projects: 'sectionPermalink.projects',
  contact: 'sectionPermalink.contact',
} as const satisfies Record<StaticPageId, TranslationKey>;

@Component({
  selector: 'app-section-permalink',
  templateUrl: './section-permalink.component.html',
  styleUrl: './section-permalink.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPermalinkComponent {
  readonly sectionId = input.required<StaticPageId>();

  readonly #localeContext = inject(LocaleContextService);
  readonly #navigation = inject(PortfolioNavigationService);
  readonly #translations = inject(TranslationService);

  protected readonly accessibleLabel = computed(() =>
    this.#translations.translate(permalinkTranslationKeys[this.sectionId()]),
  );
  protected readonly href = computed(() =>
    this.#navigation.sectionHref(this.#localeContext.locale(), this.sectionId()),
  );

  protected handleNavigation(event: MouseEvent): void {
    this.#navigation.navigateToSection(event, this.#localeContext.locale(), this.sectionId());
  }
}
