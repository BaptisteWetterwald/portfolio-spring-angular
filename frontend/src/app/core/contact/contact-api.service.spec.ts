import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ContactApiService } from './contact-api.service';

describe('ContactApiService', () => {
  let http: HttpTestingController;
  let service: ContactApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ContactApiService);
  });

  afterEach(() => {
    http.verify();
  });

  it('posts the contact payload through the configured API path', () => {
    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.test',
      subject: 'Project conversation',
      message: 'I would like to discuss a software project with you.',
      organizationWebsite: '',
    };
    let completed = false;

    service.submit(payload).subscribe({ complete: () => (completed = true) });

    const request = http.expectOne('/api/v1/contact');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
