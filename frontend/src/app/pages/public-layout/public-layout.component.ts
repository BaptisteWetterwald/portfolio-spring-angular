import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { SupportedLocale, toSupportedLocale } from '../../core/i18n/locales';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';
import { SiteHeaderComponent } from '../../shared/site-header/site-header.component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, SiteFooterComponent, SiteHeaderComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  protected readonly locale: () => SupportedLocale;

  constructor() {
    const route = inject(ActivatedRoute);
    const localeContext = inject(LocaleContextService);
    const locale = toSupportedLocale(route.snapshot.data['locale']);

    localeContext.setLocale(locale);
    this.locale = localeContext.locale;
  }
}
