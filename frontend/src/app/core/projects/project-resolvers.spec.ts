import { HttpErrorResponse } from '@angular/common/http';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot } from '@angular/router';
import { lastValueFrom, NEVER, Observable, of, throwError } from 'rxjs';

import { ProjectApiService } from './project-api.service';
import {
  projectDetailResolver,
  projectDetailRequestTimeoutMs,
  projectDetailStateFromRouteData,
  projectsResolver,
  projectsStateFromRouteData,
} from './project-resolvers';
import { ProjectDetailDto, ProjectSummaryDto } from './project.models';

describe('project route resolvers', () => {
  it('loads project lists for the parent route locale', async () => {
    const projects: readonly ProjectSummaryDto[] = [summaryProject()];

    configureProjectApi({
      listProjects: (locale) => {
        expect(locale).toBe('fr');

        return of(projects);
      },
    });

    const result = await resolveProjects(routeSnapshot('fr'));

    expect(result).toEqual({ kind: 'loaded', projects });
  });

  it('converts list API failures to a page error state', async () => {
    configureProjectApi({
      listProjects: () => throwError(() => new Error('network')),
    });

    const result = await resolveProjects(routeSnapshot('en'));

    expect(result).toEqual({ kind: 'error' });
  });

  it('loads project detail for the localized slug route', async () => {
    const project = detailProject();

    configureProjectApi({
      getProject: (locale, slug) => {
        expect(locale).toBe('fr');
        expect(slug).toBe('portfolio-api');

        return of(project);
      },
    });

    const result = await resolveProjectDetail(routeSnapshot('fr', 'portfolio-api'));

    expect(result).toEqual({ kind: 'loaded', project });
  });

  it('converts detail 404 responses to a not-found state', async () => {
    configureProjectApi({
      getProject: () =>
        throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    });

    const result = await resolveProjectDetail(routeSnapshot('en', 'missing-project'));

    expect(result).toEqual({ kind: 'notFound' });
  });

  it.each(['Not-Valid', 'project slug', '-project', 'project-', 'project--slug'])(
    'rejects an invalid public project slug without calling the backend: %s',
    async (slug) => {
      const getProject = vi.fn(() => of(detailProject()));

      configureProjectApi({ getProject });

      const result = await resolveProjectDetail(routeSnapshot('en', slug));

      expect(result).toEqual({ kind: 'notFound' });
      expect(getProject).not.toHaveBeenCalled();
    },
  );

  it('converts non-404 detail failures to an error state', async () => {
    configureProjectApi({
      getProject: () =>
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
    });

    const result = await resolveProjectDetail(routeSnapshot('en', 'broken-project'));

    expect(result).toEqual({ kind: 'error' });
  });

  it('converts a project detail request timeout to an error state', async () => {
    vi.useFakeTimers();

    try {
      configureProjectApi({
        getProject: () => NEVER,
      });

      const resultPromise = resolveProjectDetail(routeSnapshot('en', 'slow-project'));

      await vi.advanceTimersByTimeAsync(projectDetailRequestTimeoutMs);

      await expect(resultPromise).resolves.toEqual({ kind: 'error' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not synthesize unreachable loading states from missing route data', () => {
    expect(projectsStateFromRouteData(undefined)).toEqual({ kind: 'error' });
    expect(projectDetailStateFromRouteData(undefined)).toEqual({ kind: 'notFound' });
  });
});

function configureProjectApi(methods: Partial<ProjectApiService>): void {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ProjectApiService,
        useValue: {
          listProjects: () => of([]),
          listFeaturedProjects: () => of([]),
          getProject: () => of(detailProject()),
          ...methods,
        },
      },
    ],
  });
}

function resolveProjects(route: ActivatedRouteSnapshot) {
  return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
    lastValueFrom(projectsResolver(route, {} as RouterStateSnapshot) as Observable<unknown>),
  );
}

function resolveProjectDetail(route: ActivatedRouteSnapshot) {
  return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
    lastValueFrom(projectDetailResolver(route, {} as RouterStateSnapshot) as Observable<unknown>),
  );
}

function routeSnapshot(locale: 'fr' | 'en', slug?: string): ActivatedRouteSnapshot {
  return {
    parent: {
      data: {
        locale,
      },
    },
    paramMap: convertToParamMap(slug ? { slug } : {}),
  } as unknown as ActivatedRouteSnapshot;
}

function summaryProject(): ProjectSummaryDto {
  return {
    slug: 'portfolio-api',
    title: 'Portfolio API',
    shortDescription: 'Public API fixture.',
    logoMediaRef: null,
    githubUrl: null,
    demoUrl: null,
    featured: true,
    status: 'PUBLISHED',
    presentationMode: 'DETAIL',
    displayOrder: 10,
    technologies: [],
  };
}

function detailProject(): ProjectDetailDto {
  return {
    ...summaryProject(),
    detailedDescription: null,
    sections: [],
    availableLocales: ['en'],
  };
}
