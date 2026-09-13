// @vitest-environment node

import { once } from 'node:events';
import { get, type IncomingHttpHeaders, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';

import express from 'express';

import { backendInternalOriginEnvVar } from './server-api-proxy';
import { loadSitemapXml } from './server-crawl-discovery';
import { registerSitemapRoute, type SitemapLoader } from './server-sitemap-route';

const originalBackendInternalOrigin = process.env[backendInternalOriginEnvVar];

describe('Express sitemap endpoint', () => {
  beforeEach(() => {
    process.env[backendInternalOriginEnvVar] = 'http://backend:8080';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    if (originalBackendInternalOrigin === undefined) {
      delete process.env[backendInternalOriginEnvVar];
    } else {
      process.env[backendInternalOriginEnvVar] = originalBackendInternalOrigin;
    }
  });

  it('returns a cacheable XML sitemap when all localized indexes are available', async () => {
    const fetchBackend = vi.fn(async () =>
      Response.json([
        {
          slug: 'portfolio-spring-angular',
          status: 'PUBLISHED',
          presentationMode: 'DETAIL',
        },
      ]),
    );
    const response = await requestSitemap((backendOrigin) =>
      loadSitemapXml(backendOrigin, fetchBackend),
    );

    expect(fetchBackend).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.headers['cache-control']).toBe(
      'public, max-age=900, stale-while-revalidate=3600',
    );
    expect(response.body).toContain('<loc>https://bwetterwald.fr/fr</loc>');
    expect(response.body).toContain(
      '<loc>https://bwetterwald.fr/en/projects/portfolio-spring-angular</loc>',
    );
  });

  it('returns a non-cacheable plain-text 503 when a backend index fails', async () => {
    const response = await requestSitemap((backendOrigin) =>
      loadSitemapXml(backendOrigin, async () => new Response(null, { status: 503 })),
    );

    expectSitemapUnavailable(response);
  });

  it('returns a non-cacheable plain-text 503 when backend requests time out', async () => {
    const response = await requestSitemap((backendOrigin) =>
      loadSitemapXml(backendOrigin, pendingUntilAborted, 20),
    );

    expectSitemapUnavailable(response);
  });
});

interface SitemapResponse {
  readonly status: number;
  readonly headers: IncomingHttpHeaders;
  readonly body: string;
}

async function requestSitemap(sitemapLoader: SitemapLoader): Promise<SitemapResponse> {
  const app = express();
  registerSitemapRoute(app, sitemapLoader);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address() as AddressInfo;

    return await new Promise<SitemapResponse>((resolve, reject) => {
      const request = get(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/sitemap.xml',
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => {
            resolve({
              status: response.statusCode ?? 0,
              headers: response.headers,
              body: Buffer.concat(chunks).toString('utf8'),
            });
          });
        },
      );

      request.on('error', reject);
    });
  } finally {
    await closeServer(server);
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function expectSitemapUnavailable(response: SitemapResponse): void {
  expect(response.status).toBe(503);
  expect(response.headers['content-type']).toContain('text/plain');
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.body).toBe('Sitemap temporarily unavailable.');
}

function pendingUntilAborted(_input: URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;

    if (!signal) {
      reject(new Error('Expected a request timeout signal.'));
      return;
    }

    const rejectAsAborted = () => reject(signal.reason ?? new Error('Request aborted.'));

    if (signal.aborted) {
      rejectAsAborted();
      return;
    }

    signal.addEventListener('abort', rejectAsAborted, { once: true });
  });
}
