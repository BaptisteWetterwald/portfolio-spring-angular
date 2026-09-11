import { RenderMode, ServerRoute } from '@angular/ssr';

import { supportedLocales } from './core/i18n/locales';
import { localizedPath, staticPageIds } from './core/routing/localized-routes';
import { serverRoutes } from './app.routes.server';

describe('server routes', () => {
  it('keeps the locale-negotiating root route temporary at the Express layer', () => {
    expect(serverRoute('')).toEqual({
      path: '',
      renderMode: RenderMode.Server,
    });
  });

  it('renders localized portfolio documents without a redirect status override', () => {
    for (const locale of supportedLocales) {
      expect(serverRoute(toServerPath(localizedPath(locale, 'home')))).toEqual({
        path: locale,
        renderMode: RenderMode.Server,
      });
    }
  });

  it('marks former localized section documents as permanent redirects', () => {
    for (const locale of supportedLocales) {
      for (const pageId of staticPageIds.filter((candidate) => candidate !== 'home')) {
        expect(serverRoute(toServerPath(localizedPath(locale, pageId)))).toEqual({
          path: toServerPath(localizedPath(locale, pageId)),
          renderMode: RenderMode.Server,
          status: 308,
        });
      }
    }
  });

  it('does not impose a status on project detail routes', () => {
    for (const locale of supportedLocales) {
      expect(serverRoute(toServerPath(`${localizedPath(locale, 'projects')}/:slug`))).toEqual({
        path: toServerPath(`${localizedPath(locale, 'projects')}/:slug`),
        renderMode: RenderMode.Server,
      });
    }
  });
});

function serverRoute(path: string): ServerRoute | undefined {
  return serverRoutes.find((route) => route.path === path);
}

function toServerPath(path: string): string {
  return path.replace(/^\/+/, '');
}
