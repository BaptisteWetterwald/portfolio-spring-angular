import {
  createBackendRequestUrl,
  parseBackendInternalOrigin,
  proxyBackendApiRequest,
  type BackendApiProxyRequest,
} from './server-api-proxy';

const baseRequest: BackendApiProxyRequest = {
  originalUrl: '/api/health',
  method: 'GET',
  headers: {},
  protocol: 'http',
  hasBody: false,
};

describe('server API proxy', () => {
  it('accepts and normalizes an http backend origin', () => {
    expect(parseBackendInternalOrigin('http://backend:8080')).toBe('http://backend:8080');
  });

  it('accepts and normalizes an https backend origin', () => {
    expect(parseBackendInternalOrigin('https://api.example.test/base?ignored=true')).toBe(
      'https://api.example.test',
    );
  });

  it('normalizes a trailing slash to the configured origin', () => {
    expect(parseBackendInternalOrigin(' http://backend:8080/ ')).toBe('http://backend:8080');
  });

  it('rejects an invalid backend origin URL', () => {
    expect(parseBackendInternalOrigin('not a url')).toBeUndefined();
  });

  it('rejects an unsupported backend origin protocol', () => {
    expect(parseBackendInternalOrigin('ftp://backend:21')).toBeUndefined();
  });

  it('keeps browser input from selecting the upstream host', () => {
    const targetUrl = createBackendRequestUrl(
      'http://backend:8080',
      'https://attacker.example/api/health?check=1',
    );

    expect(targetUrl.origin).toBe('http://backend:8080');
    expect(targetUrl.pathname).toBe('/https://attacker.example/api/health');
    expect(targetUrl.search).toBe('?check=1');
  });

  it('forwards successful requests with method, body, path, query, and relevant headers', async () => {
    let capturedUrl: URL | undefined;
    let capturedInit: (RequestInit & { duplex?: 'half' }) | undefined;

    const response = await proxyBackendApiRequest(
      {
        originalUrl: '/api/health?probe=1',
        method: 'POST',
        headers: {
          accept: 'application/json',
          connection: 'keep-alive',
          host: 'frontend:4000',
        },
        protocol: 'https',
        hasBody: true,
        body: 'payload',
      },
      'http://backend:8080/',
      async (url, init) => {
        capturedUrl = url;
        capturedInit = init;

        return new Response('ok', {
          status: 201,
          headers: { 'x-upstream': 'accepted' },
        });
      },
    );

    const capturedHeaders = capturedInit?.headers as Headers;

    expect(response.status).toBe(201);
    expect(response.headers.get('x-upstream')).toBe('accepted');
    expect(capturedUrl?.href).toBe('http://backend:8080/api/health?probe=1');
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBe('payload');
    expect(capturedInit?.duplex).toBe('half');
    expect(capturedHeaders.get('accept')).toBe('application/json');
    expect(capturedHeaders.get('x-forwarded-host')).toBe('frontend:4000');
    expect(capturedHeaders.get('x-forwarded-proto')).toBe('https');
    expect(capturedHeaders.has('connection')).toBe(false);
  });

  it('returns a deliberate gateway response when the backend is unreachable', async () => {
    const response = await proxyBackendApiRequest(baseRequest, 'http://backend:8080', async () => {
      throw new TypeError('fetch failed');
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      status: 'DOWN',
      error: 'Backend service is unavailable.',
    });
  });

  it('returns a deliberate unavailable response for invalid backend configuration', async () => {
    const response = await proxyBackendApiRequest(baseRequest, 'notaurl');

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: 'DOWN',
      error: 'Backend service is unavailable.',
    });
  });
});
