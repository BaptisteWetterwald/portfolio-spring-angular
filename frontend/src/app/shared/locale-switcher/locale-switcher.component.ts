import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  UrlTree,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { LocalePreferenceService } from '../../core/i18n/locale-preference.service';
import { SupportedLocale, supportedLocales } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { projectDetailStateKey } from '../../core/projects/project-resolvers';
import { ProjectDetailPageState } from '../../core/projects/project.models';
import { equivalentLocalizedPath } from '../../core/routing/localized-routes';

@Component({
  selector: 'app-locale-switcher',
  imports: [RouterLink],
  templateUrl: './locale-switcher.component.html',
  styleUrl: './locale-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcherComponent {
  protected readonly locales = supportedLocales;
  protected readonly currentLocale = inject(LocaleContextService).locale;

  readonly #localePreference = inject(LocalePreferenceService);
  readonly #router = inject(Router);
  readonly #translations = inject(TranslationService);
  readonly #currentUrl = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.#router.url),
    ),
    { requireSync: true },
  );

  protected localePath(locale: SupportedLocale): UrlTree {
    return this.#router.parseUrl(
      equivalentLocalizedPath(
        this.#currentUrl(),
        locale,
        projectDetailAvailableLocales(this.#router.routerState.snapshot.root),
      ),
    );
  }

  protected localeLabel(locale: SupportedLocale): string {
    return this.#translations.translateFor(locale, `localeSwitcher.${locale}`);
  }

  protected localeAriaLabel(locale: SupportedLocale): string {
    return this.#translations.translate(`localeSwitcher.to${capitalizeLocale(locale)}`);
  }

  protected switchLocale(locale: SupportedLocale): void {
    this.#localePreference.persistLocaleChoice(locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}

function capitalizeLocale(locale: SupportedLocale): 'Fr' | 'En' | 'Hu' {
  return ({ fr: 'Fr', en: 'En', hu: 'Hu' } as const)[locale];
}

function projectDetailAvailableLocales(
  route: ActivatedRouteSnapshot,
): readonly SupportedLocale[] | undefined {
  const projectDetailState = route.data[projectDetailStateKey] as
    ProjectDetailPageState | undefined;

  if (projectDetailState?.kind === 'loaded') {
    return projectDetailState.project.availableLocales;
  }

  for (const child of route.children) {
    const availableLocales = projectDetailAvailableLocales(child);

    if (availableLocales) {
      return availableLocales;
    }
  }

  return undefined;
}
