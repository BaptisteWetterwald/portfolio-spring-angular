import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  RESPONSE_INIT,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { projectMediaSrc } from '../../core/projects/project-media';
import {
  projectDetailStateFromRouteData,
  projectDetailStateKey,
} from '../../core/projects/project-resolvers';
import { localizedPath } from '../../core/routing/localized-routes';
import { NotFoundPageComponent } from '../not-found-page/not-found-page.component';

@Component({
  selector: 'app-project-detail-page',
  imports: [RouterLink, NotFoundPageComponent],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #routeData = toSignal(this.#route.data, { initialValue: this.#route.snapshot.data });
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly projectsPath = localizedPath(this.locale, 'projects');
  protected readonly state = computed(() =>
    projectDetailStateFromRouteData(this.#routeData()[projectDetailStateKey]),
  );
  protected readonly project = computed(() => {
    const state = this.state();

    return state.kind === 'loaded' ? state.project : undefined;
  });
  protected readonly mediaSrc = computed(() => projectMediaSrc(this.project()?.logoMediaRef));

  readonly #localeContext = inject(LocaleContextService);
  readonly #metadata = inject(PageMetadataService);
  readonly #responseInit = inject(RESPONSE_INIT, { optional: true });

  constructor() {
    this.#localeContext.setLocale(this.locale);

    effect(() => {
      const state = this.state();

      if (state.kind === 'loaded') {
        this.#metadata.applyProjectDetail(this.locale, state.project);
        return;
      }

      if (state.kind === 'notFound') {
        if (this.#responseInit) {
          this.#responseInit.status = 404;
        }
        return;
      }

      this.#metadata.applyStaticPage('projects', this.locale);
    });
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }

  protected externalLinkLabel(kind: 'github' | 'demo'): string {
    return this.#translations.translate(`projects.links.${kind}`);
  }

  protected externalLinkAria(kind: 'github' | 'demo'): string {
    const project = this.project();

    return project
      ? `${this.externalLinkLabel(kind)}: ${project.title}`
      : this.externalLinkLabel(kind);
  }
}
