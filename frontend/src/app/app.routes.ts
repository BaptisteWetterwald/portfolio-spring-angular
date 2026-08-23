import { Routes } from '@angular/router';

import { supportedLocales } from './core/i18n/locales';
import { rootLocaleRedirectGuard } from './core/routing/root-locale-redirect.guard';
import { localizedSegment, StaticPageId, staticPageIds } from './core/routing/localized-routes';
import {
  projectDetailResolver,
  projectDetailStateKey,
  projectsPageStateKey,
  projectsResolver,
} from './core/projects/project-resolvers';
import { EducationPageComponent } from './pages/education-page/education-page.component';
import { ExperiencePageComponent } from './pages/experience-page/experience-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LocalizedPageComponent } from './pages/localized-page/localized-page.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { ProjectDetailPageComponent } from './pages/project-detail-page/project-detail-page.component';
import { ProjectsPageComponent } from './pages/projects-page/projects-page.component';
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
      ...staticPageIds.map((pageId) => localizedStaticPageRoute(locale, pageId)),
      localizedProjectDetailRoute(locale),
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

function localizedStaticPageRoute(
  locale: (typeof supportedLocales)[number],
  pageId: StaticPageId,
): Routes[number] {
  if (pageId === 'projects') {
    return {
      path: localizedSegment(locale, pageId),
      pathMatch: 'full',
      component: ProjectsPageComponent,
      resolve: {
        [projectsPageStateKey]: projectsResolver,
      },
      data: {
        pageId,
      },
    };
  }

  if (pageId === 'home') {
    return {
      path: localizedSegment(locale, pageId),
      pathMatch: 'full',
      component: HomePageComponent,
      data: {
        pageId,
      },
    };
  }

  if (pageId === 'education') {
    return {
      path: localizedSegment(locale, pageId),
      pathMatch: 'full',
      component: EducationPageComponent,
      data: {
        pageId,
      },
    };
  }

  if (pageId === 'experience') {
    return {
      path: localizedSegment(locale, pageId),
      pathMatch: 'full',
      component: ExperiencePageComponent,
      data: {
        pageId,
      },
    };
  }

  return {
    path: localizedSegment(locale, pageId),
    pathMatch: 'full',
    component: LocalizedPageComponent,
    data: {
      pageId,
    },
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
