import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendApiUrlService } from './backend-api-url.service';

export interface BackendHealth {
  readonly status: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendHealthService {
  readonly #apiUrl = inject(BackendApiUrlService);
  readonly #http = inject(HttpClient);

  getHealth(): Observable<BackendHealth> {
    return this.#http.get<BackendHealth>(this.#apiUrl.resolve('/health'));
  }
}
