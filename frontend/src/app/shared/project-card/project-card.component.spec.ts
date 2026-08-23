import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { projectMediaSrc } from '../../core/projects/project-media';
import { ProjectSummaryDto } from '../../core/projects/project.models';
import { ProjectCardComponent } from './project-card.component';

@Component({
  imports: [ProjectCardComponent],
  template: `<app-project-card [project]="project" locale="en" />`,
})
class ProjectCardHostComponent {
  project: ProjectSummaryDto = projectFixture();
}

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders a semantic project link and technology labels', () => {
    const card = fixture.nativeElement as HTMLElement;
    const titleLink = card.querySelector<HTMLAnchorElement>('h3 a');

    expect(card.querySelector('article')).not.toBeNull();
    expect(titleLink?.textContent).toContain('Portfolio API');
    expect(titleLink?.getAttribute('href')).toBe('/en/projects/portfolio-api');
    expect(titleLink?.getAttribute('aria-label')).toContain('Portfolio API');
    expect(Array.from(card.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(
      ['Angular', 'Spring Boot'],
    );
  });

  it('uses card and badge primitives with media-safe layout hooks', () => {
    const card = fixture.nativeElement as HTMLElement;
    const article = card.querySelector('article');

    expect(article?.classList.contains('card')).toBe(true);
    expect(article?.classList.contains('project-card--featured')).toBe(true);
    expect(article?.classList.contains('project-card--with-media')).toBe(true);
    expect(card.querySelector('.project-card__status.badge')).not.toBeNull();
    expect(card.querySelectorAll('.project-card__technology.badge').length).toBe(2);
  });

  it('renders optional external links only when present', () => {
    const card = fixture.nativeElement as HTMLElement;
    const externalLinks = Array.from(card.querySelectorAll<HTMLAnchorElement>('nav a'));

    expect(externalLinks.map((link) => link.textContent?.trim())).toEqual(['GitHub', 'Demo']);
    expect(externalLinks[0]?.target).toBe('_blank');
    expect(externalLinks[0]?.rel).toContain('noopener');

    const noLinksFixture = TestBed.createComponent(ProjectCardHostComponent);

    noLinksFixture.componentInstance.project = {
      ...projectFixture(),
      githubUrl: null,
      demoUrl: null,
    };
    noLinksFixture.detectChanges();

    expect((noLinksFixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
  });

  it('accepts only safe project media references', () => {
    expect(projectMediaSrc('/assets/example.png')).toBe('/assets/example.png');
    expect(projectMediaSrc('https://cdn.example.test/logo.svg')).toBe(
      'https://cdn.example.test/logo.svg',
    );
    expect(projectMediaSrc('http://cdn.example.test/logo.svg')).toBe(
      'http://cdn.example.test/logo.svg',
    );
    expect(projectMediaSrc('//external.example/logo.svg')).toBeUndefined();
    expect(projectMediaSrc('javascript:alert(1)')).toBeUndefined();
    expect(projectMediaSrc('data:image/svg+xml;base64,AAAA')).toBeUndefined();
    expect(projectMediaSrc('media/projects/logo.svg')).toBeUndefined();
    expect(projectMediaSrc(null)).toBeUndefined();
  });
});

function projectFixture(): ProjectSummaryDto {
  return {
    slug: 'portfolio-api',
    title: 'Portfolio API',
    shortDescription: 'A public API fixture.',
    logoMediaRef: '/media/projects/portfolio-api.svg',
    githubUrl: 'https://example.test/portfolio-api.git',
    demoUrl: 'https://demo.example.test/portfolio-api',
    featured: true,
    status: 'PUBLISHED',
    displayOrder: 10,
    technologies: [
      {
        slug: 'angular',
        name: 'Angular',
        iconRef: null,
        category: 'framework',
      },
      {
        slug: 'spring-boot',
        name: 'Spring Boot',
        iconRef: null,
        category: 'framework',
      },
    ],
  };
}
