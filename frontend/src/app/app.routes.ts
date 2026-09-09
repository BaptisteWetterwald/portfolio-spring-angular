import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import {
  githubActivityResolver,
  githubActivityStateKey,
} from './core/github/github-activity.resolver';
import { supportedLocales } from './core/i18n/locales';
import { rootLocaleRedirectGuard } from './core/routing/root-locale-redirect.guard';
import { localizedSegment, StaticPageId, staticPageIds } from './core/routing/localized-routes';
import {
  projectDetailResolver,
  projectDetailStateKey,
  projectsPageStateKey,
  projectsResolver,
} from './core/projects/project-resolvers';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { PortfolioPageComponent } from './pages/portfolio-page/portfolio-page.component';
import { ProjectDetailPageComponent } from './pages/project-detail-page/project-detail-page.component';
import { PublicLayoutComponent } from './pages/public-layout/public-layout.component';
import { RootRedirectPageComponent } from './pages/root-redirect-page/root-redirect-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: RootRedirectPageComponent,
    canActivate: [rootLocaleRedirectGuard],
  },
  ...supportedLocales.map((locale): Routes[number] => ({
    path: locale,
    component: PublicLayoutComponent,
    data: {
      locale,
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: PortfolioPageComponent,
        resolve: {
          [githubActivityStateKey]: githubActivityResolver,
          [projectsPageStateKey]: projectsResolver,
        },
        data: {
          pageId: 'home',
        },
      },
      localizedProjectDetailRoute(locale),
      ...staticPageIds
        .filter((pageId) => pageId !== 'home')
        .map((pageId) => localizedSectionCompatibilityRoute(locale, pageId)),
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  })),
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];

function localizedSectionCompatibilityRoute(
  locale: (typeof supportedLocales)[number],
  pageId: Exclude<StaticPageId, 'home'>,
): Routes[number] {
  return {
    path: localizedSegment(locale, pageId),
    pathMatch: 'full',
    redirectTo: () =>
      inject(Router).createUrlTree([`/${locale}`], {
        fragment: pageId,
      }),
  };
}

function localizedProjectDetailRoute(locale: (typeof supportedLocales)[number]): Routes[number] {
  return {
    path: `${localizedSegment(locale, 'projects')}/:slug`,
    component: ProjectDetailPageComponent,
    resolve: {
      [projectDetailStateKey]: projectDetailResolver,
    },
    data: {
      pageId: 'projectDetail',
    },
  };
}
