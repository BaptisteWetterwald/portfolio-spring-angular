import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { defaultLocale, SupportedLocale, toSupportedLocale } from '../i18n/locales';
import { ProjectApiService } from './project-api.service';
import { ProjectDetailPageState, ProjectsPageState } from './project.models';

export const projectsPageStateKey = 'projectsState';
export const projectDetailStateKey = 'projectDetailState';

export const projectsResolver: ResolveFn<ProjectsPageState> = (route) => {
  const locale = routeLocale(route);

  return inject(ProjectApiService)
    .listProjects(locale)
    .pipe(
      map((projects): ProjectsPageState => ({ kind: 'loaded', projects })),
      catchError(() => of({ kind: 'error' } satisfies ProjectsPageState)),
    );
};

export const projectDetailResolver: ResolveFn<ProjectDetailPageState> = (route) => {
  const locale = routeLocale(route);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of({ kind: 'notFound' } satisfies ProjectDetailPageState);
  }

  return inject(ProjectApiService)
    .getProject(locale, slug)
    .pipe(
      map((project): ProjectDetailPageState => ({ kind: 'loaded', project })),
      catchError((error: unknown) =>
        of(
          error instanceof HttpErrorResponse && error.status === 404
            ? ({ kind: 'notFound' } satisfies ProjectDetailPageState)
            : ({ kind: 'error' } satisfies ProjectDetailPageState),
        ),
      ),
    );
};

export function projectsStateFromRouteData(value: unknown): ProjectsPageState {
  return isProjectsPageState(value) ? value : { kind: 'error' };
}

export function projectDetailStateFromRouteData(value: unknown): ProjectDetailPageState {
  return isProjectDetailPageState(value) ? value : { kind: 'notFound' };
}

function routeLocale(route: ActivatedRouteSnapshot): SupportedLocale {
  return toSupportedLocale(route.parent?.data['locale']) ?? defaultLocale;
}

function isProjectsPageState(value: unknown): value is ProjectsPageState {
  return (
    isObject(value) &&
    (value['kind'] === 'error' || (value['kind'] === 'loaded' && Array.isArray(value['projects'])))
  );
}

function isProjectDetailPageState(value: unknown): value is ProjectDetailPageState {
  return (
    isObject(value) &&
    (value['kind'] === 'error' ||
      value['kind'] === 'notFound' ||
      (value['kind'] === 'loaded' && isObject(value['project'])))
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
