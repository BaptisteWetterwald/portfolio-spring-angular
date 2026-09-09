import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GitHubActivityApiService } from './github-activity-api.service';

describe('GitHubActivityApiService', () => {
  let http: HttpTestingController;
  let service: GitHubActivityApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(GitHubActivityApiService);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests the fixed portfolio-owned GitHub activity endpoint with transfer caching', () => {
    service.getActivity().subscribe();

    const request = http.expectOne('/api/v1/github/activity');

    expect(request.request.method).toBe('GET');
    expect(request.request.transferCache).toBe(true);
    expect(request.request.params.keys()).toEqual([]);

    request.flush({
      available: false,
      profileUrl: null,
      repositories: [],
      contributionCalendar: null,
      lastRefreshedAt: null,
      stale: false,
    });
  });
});
