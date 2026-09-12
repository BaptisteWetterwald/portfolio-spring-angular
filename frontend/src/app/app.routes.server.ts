import { RenderMode, ServerRoute } from '@angular/ssr';

import { supportedLocales } from './core/i18n/locales';
import { localizedPath, staticPageIds } from './core/routing/localized-routes';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  ...supportedLocales.flatMap((locale): ServerRoute[] => [
    {
      path: toServerRoutePath(localizedPath(locale, 'home')),
      renderMode: RenderMode.Server,
    },
    ...staticPageIds
      .filter((pageId) => pageId !== 'home')
      .map((pageId): ServerRoute => ({
        path: toServerRoutePath(localizedPath(locale, pageId)),
        renderMode: RenderMode.Server,
        status: 308,
      })),
    {
      path: toServerRoutePath(`${localizedPath(locale, 'projects')}/:slug`),
      renderMode: RenderMode.Server,
    },
    {
      path: `${locale}/**`,
      renderMode: RenderMode.Server,
      status: 404,
    },
  ]),
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
  },
];

function toServerRoutePath(path: string): string {
  return path.replace(/^\/+/, '');
}
