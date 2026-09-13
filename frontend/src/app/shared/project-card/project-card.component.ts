import { BrandIconComponent } from '../brand-icon/brand-icon.component';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { localizedProjectDetailPath } from '../../core/routing/localized-routes';
import { projectMediaSrc } from '../../core/projects/project-media';
import { ProjectSummaryDto } from '../../core/projects/project.models';

@Component({
  selector: 'app-project-card',
  imports: [BrandIconComponent, RouterLink],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<ProjectSummaryDto>();
  readonly locale = input.required<SupportedLocale>();

  protected readonly detailPath = computed(() =>
    localizedProjectDetailPath(this.locale(), this.project().slug),
  );
  protected readonly hasDetailPage = computed(() => this.project().presentationMode === 'DETAIL');
  protected readonly mediaSrc = computed(() => projectMediaSrc(this.project().logoMediaRef));

  readonly #translations = inject(TranslationService);

  protected t(key: string): string {
    return this.#translations.translateFor(this.locale(), key);
  }

  protected externalLinkLabel(kind: 'github' | 'demo'): string {
    return this.t(`projects.links.${kind}`);
  }

  protected externalLinkAria(kind: 'github' | 'demo'): string {
    return `${this.externalLinkLabel(kind)} (${this.t('projects.links.opensInNewTab')}): ${this.project().title}`;
  }

  protected detailsAriaLabel(): string {
    return `${this.t('projects.links.details')}: ${this.project().title}`;
  }
}
