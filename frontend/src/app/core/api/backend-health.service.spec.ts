import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BackendHealthService } from './backend-health.service';

describe('BackendHealthService', () => {
  let http: HttpTestingController;
  let service: BackendHealthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(BackendHealthService);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests backend health through the configured API path', () => {
    let status: string | undefined;

    service.getHealth().subscribe((health) => {
      status = health.status;
    });

    const request = http.expectOne('/api/health');
    expect(request.request.method).toBe('GET');

    request.flush({ status: 'UP' });

    expect(status).toBe('UP');
  });
});
