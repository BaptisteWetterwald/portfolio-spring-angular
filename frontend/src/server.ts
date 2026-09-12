import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type Request, type Response } from 'express';
import { join } from 'node:path';

import {
  backendInternalOriginEnvVar,
  isHopByHopHeader,
  proxyBackendApiRequest,
} from './server-api-proxy';
import { registerSitemapRoute } from './server-sitemap-route';
import {
  readLocalePreferenceCookie,
  resolvePreferredLocale,
} from './app/core/i18n/locale-resolution';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Production has exactly one trusted host proxy (Nginx) in front of this loopback-bound server.
// This makes req.protocol reflect Nginx's overwritten X-Forwarded-Proto value before /api requests
// are forwarded to the private backend. Direct public access to this port is not supported.
app.set('trust proxy', 1);

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(join(browserDistFolder, 'robots.txt'));
});

registerSitemapRoute(app);

/**
 * Proxy browser-facing API requests to the backend over the internal Docker network.
 */
app.use('/api', (req, res, next) => {
  proxyApiRequest(req, res).catch(next);
});

/**
 * Keep / as a non-canonical entry point and make built SSR redirects true HTTP redirects.
 */
app.use((req, res, next) => {
  if (req.path !== '/' || (req.method !== 'GET' && req.method !== 'HEAD')) {
    next();
    return;
  }

  const locale = resolvePreferredLocale({
    storedPreference: readLocalePreferenceCookie(req.headers.cookie),
    acceptLanguageHeader: req.headers['accept-language'],
  });

  res.redirect(302, `/${locale}`);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

async function proxyApiRequest(req: Request, res: Response): Promise<void> {
  const hasBody = requestHasBody(req);
  const backendResponse = await proxyBackendApiRequest(
    {
      originalUrl: req.originalUrl,
      method: req.method,
      headers: req.headers,
      protocol: req.protocol,
      hasBody,
      body: hasBody ? (req as unknown as BodyInit) : undefined,
    },
    process.env[backendInternalOriginEnvVar],
  );

  res.status(backendResponse.status);
  backendResponse.headers.forEach((value, header) => {
    if (!isHopByHopHeader(header)) {
      res.setHeader(header, value);
    }
  });

  res.send(Buffer.from(await backendResponse.arrayBuffer()));
}

function requestHasBody(req: Request): boolean {
  return req.method !== 'GET' && req.method !== 'HEAD';
}
