import { RenderMode, ServerRoute } from '@angular/ssr';

import { supportedLocales } from './core/i18n/locales';
import { localizedPath, staticPageIds } from './core/routing/localized-routes';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  ...supportedLocales.flatMap((locale): ServerRoute[] => [
    ...staticPageIds.map((pageId): ServerRoute => ({
      path: toServerRoutePath(localizedPath(locale, pageId)),
      renderMode: RenderMode.Server,
    })),
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
