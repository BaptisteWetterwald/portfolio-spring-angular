# Information Architecture

This document defines the routing, page hierarchy, and navigation model for the bilingual portfolio.

## Goals

- Provide shareable, crawlable URLs for every primary section and project detail.
- Support French and English routes, content, and metadata from V1.
- Make sonar/compass navigation a major visual navigation concept while preserving real semantic links.
- Support SEO, SSR, localized metadata, and accessible fallback navigation.

## Locale Strategy

Use locale-prefixed canonical routes for all public content.

| Locale | Prefix | Notes |
| --- | --- | --- |
| French | `/fr` | French content and metadata. |
| English | `/en` | English content and metadata. |

The root path `/` should redirect to a locale using this approved priority:

1. stored explicit language preference when available;
2. `Accept-Language`;
3. English fallback.

The root path itself is not canonical content.

## Domain

Production domain:

```text
https://bwetterwald.fr
```

Canonical URL examples should use this domain.

## Route Hierarchy

| Page | French URL | English URL | Purpose |
| --- | --- | --- | --- |
| Home | `/fr` | `/en` | Identity, positioning, navigation, featured work, contact entry. |
| Education | `/fr/formation` | `/en/education` | Education and semester abroad. |
| Experience | `/fr/experience` | `/en/experience` | Professional timeline and roles. |
| Projects | `/fr/projets` | `/en/projects` | Published and archived project listing. |
| Project detail | `/fr/projets/:slug` | `/en/projects/:slug` | Localized project detail. |
| Contact | `/fr/contact` | `/en/contact` | Contact options, social links, downloadable CV. |

## Project URL Strategy

Use one stable project slug shared across locales in V1.

Example:

```text
https://bwetterwald.fr/fr/projets/portfolio-spring-angular
https://bwetterwald.fr/en/projects/portfolio-spring-angular
```

Rationale:

- stable shared slugs keep database constraints simple;
- URLs remain readable and predictable;
- translation work focuses on page copy and metadata;
- project pages can become crawlable through request-time SSR without a frontend rebuild.

Localized project slugs can be introduced later with redirect mapping if there is a strong SEO reason.

## Navigation Model

The site has two coordinated navigation layers:

| Layer | Role | Requirement |
| --- | --- | --- |
| Semantic navigation | Real, accessible links for all primary routes. | Must work with keyboard, screen readers, SSR HTML, reduced motion, and no visual effects. |
| Sonar/compass/rose des vents navigation | Primary visual navigation concept. | Must enhance the semantic links, not replace them. |

The sonar/compass navigation should be treated as part of the application shell design, not only as a future animation. Its markup should still expose normal links and active states.

The conventional navigation must include:

- skip link to main content;
- visible site identity/home link;
- locale switcher;
- links to Home, Education, Experience, Projects, Contact;
- active page indication with `aria-current="page"`;
- responsive mobile navigation with focus management.

## Home Page Structure

The home page should explicitly account for:

- hero with "Baptiste Wetterwald" and Software Engineer - Backend / Full-stack positioning;
- portrait slot with future porthole treatment;
- GitHub and LinkedIn links when actual URLs are approved;
- sonar/compass navigation entry points;
- short About content;
- core technology highlights: Java/Spring, C#/.NET, TypeScript/Node.js, Angular;
- complementary Microsoft / enterprise experience summary;
- featured projects;
- optional GitHub activity;
- contact call to action.

This is a content and hierarchy specification, not a complete page design.

## Page Composition

| Page | Primary Content Blocks |
| --- | --- |
| Home | Hero, portrait, visual navigation, short About, core technologies, featured projects, optional GitHub activity, contact CTA. |
| Education | Nautical route/waypoint timeline, ENSISA engineering degree, DUT, UQAC semester abroad, optional credentials. |
| Experience | Nautical route/waypoint timeline, confirmed roles, technology/context summaries, confidentiality-aware details. |
| Projects | Featured published projects, full published list, archived/secondary project area, technology filters if useful. |
| Project detail | Title, short description, optional detailed description, logo/media reference, technologies, GitHub/demo links, related projects if useful. |
| Contact | Contact method, GitHub/LinkedIn links, downloadable CV, optional future contact form. |

## Metadata Requirements

Every canonical route needs localized:

- `title`;
- meta description;
- OpenGraph title and description;
- canonical URL;
- alternate `hreflang` links;
- structured data where relevant.

Project detail metadata should be generated from `ProjectTranslation.title` and `ProjectTranslation.shortDescription`. Optional detailed descriptions should not be required for metadata.

## Error and Redirect Routes

| Route Type | Behavior |
| --- | --- |
| `/` | Locale redirect using stored preference, `Accept-Language`, then English. |
| Unknown locale | Return 404 unless a clear redirect rule exists. |
| Unknown page | Localized 404 with semantic navigation. |
| Unknown project slug | Localized 404 with link back to Projects. |
| `DRAFT` project slug | 404 for public users. |
| Old public route | 301 redirect after a route has existed publicly. |

## Content Authoring

- English is the primary authoring language for future portfolio source copy.
- French content should be written as a natural localized adaptation, not a literal sentence-by-sentence translation.

## Remaining Decisions

- Whether localized project slugs are worth adding after V1.
