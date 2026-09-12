import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { projectMediaSrc } from '../../core/projects/project-media';
import { ProjectSummaryDto } from '../../core/projects/project.models';
import { ProjectCardComponent } from './project-card.component';

@Component({
  imports: [ProjectCardComponent],
  template: `<app-project-card [project]="project" [locale]="locale" />`,
})
class ProjectCardHostComponent {
  project: ProjectSummaryDto = projectFixture();
  locale: 'fr' | 'en' = 'en';
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

  it('renders semantic project content and technology labels', () => {
    const card = fixture.nativeElement as HTMLElement;
    const actions = card.querySelector('.project-card__links');

    expect(card.querySelector('article')).not.toBeNull();
    expect(actions?.tagName).toBe('DIV');
    expect(actions?.getAttribute('role')).toBeNull();
    expect(card.querySelector('nav')).toBeNull();
    expect(card.querySelector('h4')?.textContent).toContain('Portfolio API');
    expect(Array.from(card.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(
      ['Angular', 'Spring Boot'],
    );
  });

  it('exposes an accessible localized detail affordance for detail projects', async () => {
    const card = fixture.nativeElement as HTMLElement;
    const detailLink = card.querySelector<HTMLAnchorElement>('.project-card__action--detail');

    expect(detailLink?.textContent?.trim()).toBe('View project');
    expect(detailLink?.getAttribute('href')).toBe('/en/projects/portfolio-api');
    expect(detailLink?.getAttribute('aria-label')).toBe('View project: Portfolio API');

    const frenchFixture = TestBed.createComponent(ProjectCardHostComponent);

    frenchFixture.componentInstance.locale = 'fr';
    frenchFixture.detectChanges();
    await frenchFixture.whenStable();
    frenchFixture.detectChanges();

    const frenchCard = frenchFixture.nativeElement as HTMLElement;
    const frenchDetailLink = frenchCard.querySelector<HTMLAnchorElement>(
      '.project-card__action--detail',
    );

    expect(frenchDetailLink?.textContent?.trim()).toBe('Voir le projet');
    expect(frenchDetailLink?.getAttribute('href')).toBe('/fr/projets/portfolio-api');
  });

  it('renders card-only projects without project detail navigation', () => {
    const cardOnlyFixture = TestBed.createComponent(ProjectCardHostComponent);

    cardOnlyFixture.componentInstance.project = {
      ...projectFixture(),
      presentationMode: 'CARD_ONLY',
      githubUrl: null,
      demoUrl: null,
    };
    cardOnlyFixture.detectChanges();

    const card = cardOnlyFixture.nativeElement as HTMLElement;

    expect(card.querySelector('article')).not.toBeNull();
    expect(card.textContent).toContain('Portfolio API');
    expect(
      card.querySelector<HTMLAnchorElement>('a[href="/en/projects/portfolio-api"]'),
    ).toBeNull();
    expect(card.querySelector('.project-card__action--detail')).toBeNull();
    expect(card.querySelector('nav')).toBeNull();
  });

  it('uses card and badge primitives with media-safe layout hooks', () => {
    const card = fixture.nativeElement as HTMLElement;
    const article = card.querySelector('article');

    expect(article?.classList.contains('card')).toBe(true);
    expect(article?.classList.contains('project-card--featured')).toBe(true);
    expect(article?.classList.contains('project-card--with-media')).toBe(true);
    expect(article?.classList.contains('project-card--has-detail')).toBe(true);
    expect(card.querySelectorAll('.project-card__technology.badge').length).toBe(2);
  });

  it('omits the public published badge and keeps the archived badge', () => {
    const publishedCard = fixture.nativeElement as HTMLElement;

    expect(publishedCard.textContent).not.toContain('Published');
    expect(publishedCard.querySelector('.project-card__status.badge')).toBeNull();

    const archivedFixture = TestBed.createComponent(ProjectCardHostComponent);

    archivedFixture.componentInstance.project = {
      ...projectFixture(),
      status: 'ARCHIVED',
    };
    archivedFixture.detectChanges();

    const archivedCard = archivedFixture.nativeElement as HTMLElement;

    expect(archivedCard.querySelector('.project-card__status.badge')?.textContent).toContain(
      'Archived',
    );
  });

  it('renders optional external links only when present', () => {
    const card = fixture.nativeElement as HTMLElement;
    const externalLinks = Array.from(
      card.querySelectorAll<HTMLAnchorElement>('.project-card__links a'),
    );

    expect(externalLinks.map((link) => link.textContent?.trim())).toEqual([
      'View project',
      'GitHub',
      'Demo',
    ]);
    expect(externalLinks[1]?.target).toBe('_blank');
    expect(externalLinks[1]?.rel).toContain('noopener');
    expect(externalLinks[1]?.getAttribute('aria-label')).toBe(
      'GitHub (opens in a new tab): Portfolio API',
    );
    expect(externalLinks[1]?.classList.contains('project-card__action--external')).toBe(true);
    expect(externalLinks[0]?.classList.contains('project-card__action--detail')).toBe(true);

    const noLinksFixture = TestBed.createComponent(ProjectCardHostComponent);

    noLinksFixture.componentInstance.project = {
      ...projectFixture(),
      githubUrl: null,
      demoUrl: null,
    };
    noLinksFixture.detectChanges();

    expect(
      Array.from(
        (noLinksFixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
          '.project-card__links a',
        ),
      ).map((link) => link.textContent?.trim()),
    ).toEqual(['View project']);
  });

  it('does not nest interactive controls inside other interactive controls', () => {
    const card = fixture.nativeElement as HTMLElement;

    expect(card.querySelector('a a')).toBeNull();
    expect(card.querySelector('button a')).toBeNull();
    expect(card.querySelector('a button')).toBeNull();
  });

  it('accepts only safe project media references', () => {
    expect(projectMediaSrc('/assets/example.png')).toBe('/assets/example.png');
    expect(projectMediaSrc('https://cdn.example.test/logo.svg')).toBe(
      'https://cdn.example.test/logo.svg',
    );
    expect(projectMediaSrc('http://cdn.example.test/logo.svg')).toBeUndefined();
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
    logoMediaRef: '/assets/projects/portfolio-api.svg',
    githubUrl: 'https://example.test/portfolio-api.git',
    demoUrl: 'https://demo.example.test/portfolio-api',
    featured: true,
    status: 'PUBLISHED',
    presentationMode: 'DETAIL',
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
