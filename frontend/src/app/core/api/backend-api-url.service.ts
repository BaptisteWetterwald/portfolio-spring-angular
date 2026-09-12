import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { inject, Injectable, InjectionToken, PLATFORM_ID, REQUEST } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface BackendApiConfig {
  readonly basePath: string;
  readonly ssrInternalOrigin?: string;
}

export const BACKEND_API_CONFIG = new InjectionToken<BackendApiConfig>('Backend API config', {
  providedIn: 'root',
  factory: () => ({
    basePath: environment.backendApi.basePath,
    ssrInternalOrigin: readServerEnvironment(environment.backendApi.ssrInternalOriginEnvVar),
  }),
});

@Injectable({
  providedIn: 'root',
})
export class BackendApiUrlService {
  readonly #config = inject(BACKEND_API_CONFIG);
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #request = inject(REQUEST, { optional: true });

  resolve(path: string): string {
    const basePath = normalizePath(this.#config.basePath);
    const endpointPath = normalizePath(path);

    if (isPlatformServer(this.#platformId)) {
      const serverOrigin = httpOrigin(this.#config.ssrInternalOrigin) ?? this.#requestOrigin();

      if (serverOrigin) {
        return `${serverOrigin}${basePath}${endpointPath}`;
      }
    }

    if (isPlatformBrowser(this.#platformId)) {
      const browserOrigin = httpOrigin(this.#document.location?.origin);

      if (browserOrigin) {
        return `${browserOrigin}${basePath}${endpointPath}`;
      }
    }

    return `${basePath}${endpointPath}`;
  }

  #requestOrigin(): string | undefined {
    if (!this.#request?.url) {
      return undefined;
    }

    return httpOrigin(this.#request.url);
  }
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim();

  if (trimmedPath === '' || trimmedPath === '/') {
    return '';
  }

  return `/${trimmedPath.replace(/^\/+|\/+$/g, '')}`;
}

export function httpOrigin(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

function readServerEnvironment(name: string): string | undefined {
  const globalWithProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };
  const value = globalWithProcess.process?.env?.[name]?.trim();

  return value === '' ? undefined : value;
}
