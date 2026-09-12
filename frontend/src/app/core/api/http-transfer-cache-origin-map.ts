import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { inject, Provider, REQUEST } from '@angular/core';

import { BACKEND_API_CONFIG, httpOrigin } from './backend-api-url.service';

export const backendHttpTransferCacheOriginMapProvider: Provider = {
  provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
  useFactory: backendHttpTransferCacheOriginMap,
};

export function backendHttpTransferCacheOriginMap(): Record<string, string> {
  const config = inject(BACKEND_API_CONFIG);
  const request = inject(REQUEST, { optional: true });
  const internalOrigin = httpOrigin(config.ssrInternalOrigin);
  const publicOrigin = httpOrigin(request?.url);

  return internalOrigin && publicOrigin && internalOrigin !== publicOrigin
    ? { [internalOrigin]: publicOrigin }
    : {};
}
