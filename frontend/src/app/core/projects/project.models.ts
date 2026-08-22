import { SupportedLocale } from '../i18n/locales';

export type ProjectStatus = 'PUBLISHED' | 'ARCHIVED';

export interface TechnologyDto {
  readonly slug: string;
  readonly name: string;
  readonly iconRef: string | null;
  readonly category: string | null;
}

export interface ProjectSummaryDto {
  readonly slug: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly logoMediaRef: string | null;
  readonly githubUrl: string | null;
  readonly demoUrl: string | null;
  readonly featured: boolean;
  readonly status: ProjectStatus;
  readonly displayOrder: number;
  readonly technologies: readonly TechnologyDto[];
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  readonly detailedDescription: string | null;
  readonly availableLocales: readonly SupportedLocale[];
}

export type ProjectStatusFilter = ProjectStatus;

export interface ProjectsLoadedState {
  readonly kind: 'loaded';
  readonly projects: readonly ProjectSummaryDto[];
}

export interface ProjectsErrorState {
  readonly kind: 'error';
}

export type ProjectsPageState = ProjectsLoadedState | ProjectsErrorState;

export interface ProjectDetailLoadedState {
  readonly kind: 'loaded';
  readonly project: ProjectDetailDto;
}

export interface ProjectDetailNotFoundState {
  readonly kind: 'notFound';
}

export interface ProjectDetailErrorState {
  readonly kind: 'error';
}

export type ProjectDetailPageState =
  ProjectDetailLoadedState | ProjectDetailNotFoundState | ProjectDetailErrorState;
