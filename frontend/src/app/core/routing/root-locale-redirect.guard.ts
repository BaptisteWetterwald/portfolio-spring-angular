import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LocalePreferenceService } from '../i18n/locale-preference.service';
import { localizedPath } from './localized-routes';

export const rootLocaleRedirectGuard: CanActivateFn = () => {
  const locale = inject(LocalePreferenceService).resolveEntryLocale();

  return inject(Router).parseUrl(localizedPath(locale, 'home'));
};
