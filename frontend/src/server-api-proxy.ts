export const backendInternalOriginEnvVar = 'BACKEND_INTERNAL_ORIGIN';

const backendUnavailableBody = {
  status: 'DOWN',
  error: 'Backend service is unavailable.',
} as const;

const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'expect',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export interface BackendApiProxyRequest {
  readonly originalUrl: string;
  readonly method: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly protocol: string;
  readonly hasBody: boolean;
  readonly body?: BodyInit;
}

type FetchBackend = (input: URL, init: RequestInit & { duplex?: 'half' }) => Promise<Response>;

export async function proxyBackendApiRequest(
  request: BackendApiProxyRequest,
  backendInternalOrigin: string | undefined,
  fetchBackend: FetchBackend = fetch,
): Promise<Response> {
  const backendOrigin = parseBackendInternalOrigin(backendInternalOrigin);

  if (!backendOrigin) {
    return backendUnavailableResponse(503);
  }

  try {
    return await fetchBackend(createBackendRequestUrl(backendOrigin, request.originalUrl), {
      method: request.method,
      headers: toProxyHeaders(request.headers, request.protocol),
      body: request.hasBody ? request.body : undefined,
      duplex: request.hasBody ? 'half' : undefined,
      redirect: 'manual',
    });
  } catch {
    return backendUnavailableResponse(502);
  }
}

export function parseBackendInternalOrigin(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return undefined;
  }

  return url.origin;
}

export function createBackendRequestUrl(backendOrigin: string, originalUrl: string): URL {
  const targetUrl = new URL(backendOrigin);
  const { pathname, search } = splitPathAndQuery(originalUrl);

  targetUrl.pathname = pathname;
  targetUrl.search = search;

  return targetUrl;
}

export function isHopByHopHeader(header: string): boolean {
  return hopByHopHeaders.has(header.toLowerCase());
}

function toProxyHeaders(
  requestHeaders: Record<string, string | string[] | undefined>,
  protocol: string,
): Headers {
  const headers = new Headers();

  for (const [header, value] of Object.entries(requestHeaders)) {
    if (isHopByHopHeader(header) || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(header, entry));
    } else {
      headers.set(header, value);
    }
  }

  const host = requestHeaders['host'];

  if (typeof host === 'string') {
    headers.set('x-forwarded-host', host);
  }

  headers.set('x-forwarded-proto', protocol);

  return headers;
}

function splitPathAndQuery(originalUrl: string): { pathname: string; search: string } {
  const fragmentStart = originalUrl.indexOf('#');
  const fragmentlessUrl = fragmentStart === -1 ? originalUrl : originalUrl.slice(0, fragmentStart);
  const searchStart = fragmentlessUrl.indexOf('?');
  const rawPath = searchStart === -1 ? fragmentlessUrl : fragmentlessUrl.slice(0, searchStart);
  const search = searchStart === -1 ? '' : fragmentlessUrl.slice(searchStart);

  return {
    pathname: normalizePath(rawPath),
    search,
  };
}

function normalizePath(rawPath: string): string {
  if (!rawPath) {
    return '/';
  }

  if (!rawPath.startsWith('/')) {
    return `/${rawPath}`;
  }

  return `/${rawPath.replace(/^\/+/, '')}`;
}

function backendUnavailableResponse(status: 502 | 503): Response {
  return Response.json(backendUnavailableBody, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  });
}
