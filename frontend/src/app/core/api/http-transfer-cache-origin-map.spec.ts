import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { appConfig } from '../../app.config';
import { serverConfig } from '../../app.config.server';
import { BACKEND_API_CONFIG, BackendApiConfig } from './backend-api-url.service';
import { backendHttpTransferCacheOriginMapProvider } from './http-transfer-cache-origin-map';

describe('backend HTTP transfer-cache origin map', () => {
  it('maps the normalized internal backend origin to the incoming public origin', () => {
    configure(
      { basePath: '/api', ssrInternalOrigin: 'http://backend:8080/internal/path/' },
      'https://bwetterwald.fr/en?source=test',
    );

    expect(TestBed.inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP)).toEqual({
      'http://backend:8080': 'https://bwetterwald.fr',
    });
  });

  it('returns an empty map when the internal origin is absent', () => {
    configure({ basePath: '/api' }, 'https://bwetterwald.fr/en');

    expect(TestBed.inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP)).toEqual({});
  });

  it('returns an empty map when request context is absent', () => {
    configure({ basePath: '/api', ssrInternalOrigin: 'http://backend:8080/' });

    expect(TestBed.inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP)).toEqual({});
  });

  it('registers the origin-map token only in server configuration', () => {
    expect(hasDirectProvider(appConfig.providers, HTTP_TRANSFER_CACHE_ORIGIN_MAP)).toBe(false);
    expect(hasDirectProvider(serverConfig.providers, HTTP_TRANSFER_CACHE_ORIGIN_MAP)).toBe(true);
  });
});

function configure(config: BackendApiConfig, requestUrl?: string): void {
  TestBed.configureTestingModule({
    providers: [
      backendHttpTransferCacheOriginMapProvider,
      { provide: BACKEND_API_CONFIG, useValue: config },
      ...(requestUrl ? [{ provide: REQUEST, useValue: new Request(requestUrl) }] : []),
    ],
  });
}

function hasDirectProvider(
  providers: typeof appConfig.providers,
  token: typeof HTTP_TRANSFER_CACHE_ORIGIN_MAP,
): boolean {
  return (
    providers?.some(
      (provider) =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        provider.provide === token,
    ) ?? false
  );
}
