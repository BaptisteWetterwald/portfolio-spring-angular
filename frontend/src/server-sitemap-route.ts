import { type Express } from 'express';

import { backendInternalOriginEnvVar } from './server-api-proxy';
import { loadSitemapXml } from './server-crawl-discovery';

export type SitemapLoader = (backendInternalOrigin: string | undefined) => Promise<string>;

export function registerSitemapRoute(
  app: Express,
  sitemapLoader: SitemapLoader = loadSitemapXml,
): void {
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const sitemap = await sitemapLoader(process.env[backendInternalOriginEnvVar]);

      res.status(200);
      res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600');
      res.type('application/xml').send(sitemap);
    } catch {
      res.status(503);
      res.setHeader('Cache-Control', 'no-store');
      res.type('text/plain').send('Sitemap temporarily unavailable.');
    }
  });
}
