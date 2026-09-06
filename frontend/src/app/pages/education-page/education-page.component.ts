import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { portfolioContentFor } from '../../core/content/portfolio-content';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';

@Component({
  selector: 'app-education-page',
  templateUrl: './education-page.component.html',
  styleUrl: './education-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly content = portfolioContentFor(this.locale);

  constructor() {
    this.#localeContext.setLocale(this.locale);
  }
}
