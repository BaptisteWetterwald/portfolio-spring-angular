import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendApiUrlService } from '../api/backend-api-url.service';
import { ContactRequest } from './contact.models';

@Injectable({
  providedIn: 'root',
})
export class ContactApiService {
  readonly #apiUrl = inject(BackendApiUrlService);
  readonly #http = inject(HttpClient);

  submit(request: ContactRequest): Observable<void> {
    return this.#http.post<void>(this.#apiUrl.resolve('/v1/contact'), request);
  }
}
