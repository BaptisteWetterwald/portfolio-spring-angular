import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendApiUrlService } from '../api/backend-api-url.service';
import { SupportedLocale } from '../i18n/locales';
import { ProjectDetailDto, ProjectStatusFilter, ProjectSummaryDto } from './project.models';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService {
  readonly #apiUrl = inject(BackendApiUrlService);
  readonly #http = inject(HttpClient);

  listProjects(
    locale: SupportedLocale,
    status?: ProjectStatusFilter,
  ): Observable<readonly ProjectSummaryDto[]> {
    let params = new HttpParams().set('locale', locale);

    if (status) {
      params = params.set('status', status);
    }

    return this.#http.get<readonly ProjectSummaryDto[]>(this.#apiUrl.resolve('/v1/projects'), {
      params,
      transferCache: true,
    });
  }

  listFeaturedProjects(locale: SupportedLocale): Observable<readonly ProjectSummaryDto[]> {
    return this.#http.get<readonly ProjectSummaryDto[]>(
      this.#apiUrl.resolve('/v1/projects/featured'),
      {
        params: new HttpParams().set('locale', locale),
        transferCache: true,
      },
    );
  }

  getProject(locale: SupportedLocale, slug: string): Observable<ProjectDetailDto> {
    return this.#http.get<ProjectDetailDto>(
      this.#apiUrl.resolve(`/v1/projects/${encodeURIComponent(slug)}`),
      {
        params: new HttpParams().set('locale', locale),
        transferCache: true,
      },
    );
  }
}
