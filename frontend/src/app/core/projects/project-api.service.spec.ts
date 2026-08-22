import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProjectApiService } from './project-api.service';

describe('ProjectApiService', () => {
  let http: HttpTestingController;
  let service: ProjectApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProjectApiService);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests public projects with an explicit locale', () => {
    let projectCount: number | undefined;

    service.listProjects('fr').subscribe((projects) => {
      projectCount = projects.length;
    });

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/projects' && candidate.params.get('locale') === 'fr',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('status')).toBe(false);

    request.flush([]);

    expect(projectCount).toBe(0);
  });

  it('passes the optional public status filter', () => {
    service.listProjects('en', 'ARCHIVED').subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/projects' &&
        candidate.params.get('locale') === 'en' &&
        candidate.params.get('status') === 'ARCHIVED',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('requests featured projects for the requested locale', () => {
    service.listFeaturedProjects('fr').subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/projects/featured' && candidate.params.get('locale') === 'fr',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('encodes the detail slug and passes the locale', () => {
    service.getProject('en', 'project slug').subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/projects/project%20slug' &&
        candidate.params.get('locale') === 'en',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      slug: 'project slug',
      title: 'Project',
      shortDescription: 'Short',
      detailedDescription: null,
      logoMediaRef: null,
      githubUrl: null,
      demoUrl: null,
      featured: false,
      status: 'PUBLISHED',
      displayOrder: 10,
      technologies: [],
      availableLocales: ['en'],
    });
  });
});
