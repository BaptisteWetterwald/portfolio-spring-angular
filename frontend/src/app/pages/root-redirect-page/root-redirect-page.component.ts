import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-root-redirect-page',
  templateUrl: './root-redirect-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RootRedirectPageComponent {
  readonly #translations = inject(TranslationService);

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
