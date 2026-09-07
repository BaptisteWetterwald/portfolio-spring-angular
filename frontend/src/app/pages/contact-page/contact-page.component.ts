import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { SectionPermalinkComponent } from '../../shared/section-permalink/section-permalink.component';

@Component({
  selector: 'app-contact-page',
  imports: [SectionPermalinkComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;

  constructor() {
    this.#localeContext.setLocale(this.locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
