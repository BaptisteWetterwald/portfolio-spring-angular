import { BrandIconComponent } from '../../shared/brand-icon/brand-icon.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  RESPONSE_INIT,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { projectMediaSrc } from '../../core/projects/project-media';
import {
  projectDetailStateFromRouteData,
  projectDetailStateKey,
} from '../../core/projects/project-resolvers';
import { PortfolioNavigationService } from '../../core/routing/portfolio-navigation.service';
import { localizedPortfolioSectionUrl } from '../../core/routing/localized-routes';
import { NotFoundPageComponent } from '../not-found-page/not-found-page.component';

@Component({
  selector: 'app-project-detail-page',
  imports: [BrandIconComponent, RouterLink, NotFoundPageComponent],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #routeData = toSignal(this.#route.data, { initialValue: this.#route.snapshot.data });
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly projectsPath = this.#router.parseUrl(
    localizedPortfolioSectionUrl(this.locale, 'projects'),
  );
  protected readonly state = computed(() =>
    projectDetailStateFromRouteData(this.#routeData()[projectDetailStateKey]),
  );
  protected readonly project = computed(() => {
    const state = this.state();

    return state.kind === 'loaded' ? state.project : undefined;
  });
  protected readonly sections = computed(() => this.project()?.sections ?? []);
  protected readonly hasStructuredSections = computed(() => this.sections().length > 0);
  protected readonly mediaSrc = computed(() => projectMediaSrc(this.project()?.logoMediaRef));

  readonly #localeContext = inject(LocaleContextService);
  readonly #metadata = inject(PageMetadataService);
  readonly #navigation = inject(PortfolioNavigationService);
  readonly #responseInit = inject(RESPONSE_INIT, { optional: true });

  constructor() {
    this.#localeContext.setLocale(this.locale);

    effect(() => {
      const state = this.state();

      if (state.kind === 'loaded') {
        this.#navigation.setActiveSection('projects');
        this.#metadata.applyProjectDetail(this.locale, state.project);
        return;
      }

      if (state.kind === 'notFound') {
        this.#navigation.setActiveSection(null);
        if (this.#responseInit) {
          this.#responseInit.status = 404;
        }
        return;
      }

      this.#navigation.setActiveSection('projects');
      this.#metadata.applyProjectUnavailable(this.locale, this.#router.url);
      if (this.#responseInit) {
        this.#responseInit.status = 503;
      }
    });
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }

  protected externalLinkLabel(kind: 'github' | 'demo'): string {
    return this.#translations.translateFor(this.locale, `projects.links.${kind}`);
  }

  protected externalLinkAria(kind: 'github' | 'demo'): string {
    const project = this.project();

    return project
      ? `${this.externalLinkLabel(kind)} (${this.t('projects.links.opensInNewTab')}): ${project.title}`
      : this.externalLinkLabel(kind);
  }

  protected sectionId(index: number): string {
    return `project-section-${index + 1}`;
  }
}
