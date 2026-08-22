import { Routes } from '@angular/router';

import { supportedLocales } from './core/i18n/locales';
import { rootLocaleRedirectGuard } from './core/routing/root-locale-redirect.guard';
import { localizedSegment, StaticPageId, staticPageIds } from './core/routing/localized-routes';
import { LocalizedPageComponent } from './pages/localized-page/localized-page.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
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
  return {
    path: localizedSegment(locale, pageId),
    pathMatch: 'full',
    component: LocalizedPageComponent,
    data: {
      pageId,
    },
  };
}
