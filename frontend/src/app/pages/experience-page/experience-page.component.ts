import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { portfolioContentFor } from '../../core/content/portfolio-content';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { SectionPermalinkComponent } from '../../shared/section-permalink/section-permalink.component';

@Component({
  selector: 'app-experience-page',
  imports: [SectionPermalinkComponent],
  templateUrl: './experience-page.component.html',
  styleUrl: './experience-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperiencePageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly content = portfolioContentFor(this.locale);

  constructor() {
    this.#localeContext.setLocale(this.locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
