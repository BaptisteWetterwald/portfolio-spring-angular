import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendApiUrlService } from '../api/backend-api-url.service';
import { GitHubActivityDto } from './github-activity.models';

@Injectable({
  providedIn: 'root',
})
export class GitHubActivityApiService {
  readonly #apiUrl = inject(BackendApiUrlService);
  readonly #http = inject(HttpClient);

  getActivity(): Observable<GitHubActivityDto> {
    return this.#http.get<GitHubActivityDto>(this.#apiUrl.resolve('/v1/github/activity'), {
      transferCache: true,
    });
  }
}
