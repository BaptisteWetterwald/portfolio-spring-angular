import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  BACKEND_API_CONFIG,
  BackendApiConfig,
  BackendApiUrlService,
} from './backend-api-url.service';

interface GlobalWithProcess {
  process?: {
    env?: Record<string, string | undefined>;
  };
}

const globalWithProcess = globalThis as unknown as GlobalWithProcess;

describe('BackendApiUrlService', () => {
  let hadProcess: boolean;
  let hadProcessEnv: boolean;
  let hadBackendInternalOrigin: boolean;
  let originalBackendInternalOrigin: string | undefined;

  beforeEach(() => {
    hadProcess = Object.prototype.hasOwnProperty.call(globalWithProcess, 'process');
    hadProcessEnv = Object.prototype.hasOwnProperty.call(globalWithProcess.process ?? {}, 'env');
    hadBackendInternalOrigin = Object.prototype.hasOwnProperty.call(
      globalWithProcess.process?.env ?? {},
      'BACKEND_INTERNAL_ORIGIN',
    );
    originalBackendInternalOrigin = globalWithProcess.process?.env?.['BACKEND_INTERNAL_ORIGIN'];
  });

  afterEach(() => {
    if (globalWithProcess.process?.env) {
      if (hadBackendInternalOrigin) {
        globalWithProcess.process.env['BACKEND_INTERNAL_ORIGIN'] = originalBackendInternalOrigin;
      } else {
        delete globalWithProcess.process.env['BACKEND_INTERNAL_ORIGIN'];
      }
    }

    if (!hadProcessEnv && globalWithProcess.process) {
      delete globalWithProcess.process.env;
    }

    if (!hadProcess) {
      delete globalWithProcess.process;
    }
  });

  it('resolves browser requests to the same-origin API path', () => {
    configureUrlService('browser', { basePath: '/api' });

    expect(TestBed.inject(BackendApiUrlService).resolve('/health')).toBe('/api/health');
  });

  it('resolves SSR requests to the configured internal backend origin', () => {
    configureUrlService('server', {
      basePath: '/api',
      ssrInternalOrigin: 'http://backend:8080/',
    });

    expect(TestBed.inject(BackendApiUrlService).resolve('health')).toBe(
      'http://backend:8080/api/health',
    );
  });

  it('resolves SSR requests to the incoming request origin when no internal origin is configured', () => {
    configureUrlService('server', { basePath: '/api' }, 'https://bwetterwald.fr/en');

    expect(TestBed.inject(BackendApiUrlService).resolve('/health')).toBe(
      'https://bwetterwald.fr/api/health',
    );
  });

  it('treats a blank BACKEND_INTERNAL_ORIGIN as absent', () => {
    setBackendInternalOrigin('   ');
    configureUrlServiceWithDefaultConfig('server', 'https://bwetterwald.fr/fr');

    expect(TestBed.inject(BackendApiUrlService).resolve('/health')).toBe(
      'https://bwetterwald.fr/api/health',
    );
  });

  it('normalizes slashes between origin, base path, and endpoint path', () => {
    configureUrlService('server', {
      basePath: '///api///',
      ssrInternalOrigin: 'http://backend:8080///',
    });

    expect(TestBed.inject(BackendApiUrlService).resolve('///v1/projects///')).toBe(
      'http://backend:8080/api/v1/projects',
    );
  });
});

function configureUrlService(
  platformId: 'browser' | 'server',
  config: BackendApiConfig,
  requestUrl?: string,
): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: BACKEND_API_CONFIG, useValue: config },
      ...(requestUrl ? [{ provide: REQUEST, useValue: new Request(requestUrl) }] : []),
    ],
  });
}

function configureUrlServiceWithDefaultConfig(
  platformId: 'browser' | 'server',
  requestUrl?: string,
): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      ...(requestUrl ? [{ provide: REQUEST, useValue: new Request(requestUrl) }] : []),
    ],
  });
}

function setBackendInternalOrigin(value: string): void {
  globalWithProcess.process ??= {};
  globalWithProcess.process.env ??= {};
  globalWithProcess.process.env['BACKEND_INTERNAL_ORIGIN'] = value;
}
