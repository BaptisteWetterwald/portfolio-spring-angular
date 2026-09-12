import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { backendHttpTransferCacheOriginMapProvider } from './core/api/http-transfer-cache-origin-map';

export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    backendHttpTransferCacheOriginMapProvider,
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
