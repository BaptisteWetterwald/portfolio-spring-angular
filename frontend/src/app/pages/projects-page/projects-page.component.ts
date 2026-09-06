import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import {
  projectsPageStateKey,
  projectsStateFromRouteData,
} from '../../core/projects/project-resolvers';
import { ProjectCardComponent } from '../../shared/project-card/project-card.component';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectCardComponent],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #routeData = toSignal(this.#route.data, { initialValue: this.#route.snapshot.data });
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly state = computed(() =>
    projectsStateFromRouteData(this.#routeData()[projectsPageStateKey]),
  );
  protected readonly loadedProjects = computed(() => {
    const state = this.state();

    return state.kind === 'loaded' ? state.projects : [];
  });
  protected readonly featuredProjects = computed(() =>
    this.loadedProjects().filter((project) => project.status === 'PUBLISHED' && project.featured),
  );
  protected readonly publishedProjects = computed(() =>
    this.loadedProjects().filter((project) => project.status === 'PUBLISHED' && !project.featured),
  );
  protected readonly archivedProjects = computed(() =>
    this.loadedProjects().filter((project) => project.status === 'ARCHIVED'),
  );
  protected readonly projectCount = computed(() => this.loadedProjects().length);

  readonly #localeContext = inject(LocaleContextService);

  constructor() {
    this.#localeContext.setLocale(this.locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }
}
