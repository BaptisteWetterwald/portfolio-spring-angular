import { isPlatformServer } from '@angular/common';
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
  readonly #platformId = inject(PLATFORM_ID);
  readonly #request = inject(REQUEST, { optional: true });

  resolve(path: string): string {
    const basePath = normalizePath(this.#config.basePath);
    const endpointPath = normalizePath(path);

    if (isPlatformServer(this.#platformId)) {
      const serverOrigin = this.#config.ssrInternalOrigin ?? this.#requestOrigin();

      if (serverOrigin) {
        return `${trimTrailingSlash(serverOrigin)}${basePath}${endpointPath}`;
      }
    }

    return `${basePath}${endpointPath}`;
  }

  #requestOrigin(): string | undefined {
    if (!this.#request?.url) {
      return undefined;
    }

    return new URL(this.#request.url).origin;
  }
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim();

  if (trimmedPath === '' || trimmedPath === '/') {
    return '';
  }

  return `/${trimmedPath.replace(/^\/+|\/+$/g, '')}`;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/g, '');
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
