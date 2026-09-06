import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ThemePreferenceService } from '../../core/theme/theme-preference.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { LighthouseBeamSource } from '../lighthouse-beam/lighthouse-beam-source';

@Component({
  selector: 'app-lighthouse-theme-toggle',
  templateUrl: './lighthouse-theme-toggle.component.html',
  styleUrl: './lighthouse-theme-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LighthouseThemeToggleComponent {
  readonly beamSource = input<LighthouseBeamSource>('header');

  readonly #themePreference = inject(ThemePreferenceService);
  readonly #translations = inject(TranslationService);

  protected readonly isDark = computed(() => this.#themePreference.theme() === 'dark');
  protected readonly ariaLabel = computed(() =>
    this.#translations.translate(this.isDark() ? 'theme.switchToLight' : 'theme.switchToDark'),
  );
  protected readonly stateLabel = computed(() =>
    this.#translations.translate(this.isDark() ? 'theme.darkActive' : 'theme.lightActive'),
  );

  protected toggleTheme(): void {
    this.#themePreference.toggleTheme();
  }
}
