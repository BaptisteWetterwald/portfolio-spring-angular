import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('/api/health').flush({ status: 'UP' });

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the bootstrap placeholder', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne('/api/health').flush({ status: 'UP' });

    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Portfolio application scaffold');
  });

  it('should render backend health status after the bootstrap check succeeds', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    http.expectOne('/api/health').flush({ status: 'UP' });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-backend-state]')?.textContent).toContain(
      'Backend health: UP',
    );
  });
});
