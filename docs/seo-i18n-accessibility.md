# SEO, I18n, and Accessibility

This document defines requirements and implementation direction for discoverability, localization, and inclusive access.

## Languages

The site must support:

- French;
- English.

All public canonical pages must have localized route, content, and metadata.

## Domain and Root Redirect

Production domain:

```text
https://bwetterwald.fr
```

Root `/` redirects using:

1. stored explicit language preference when available;
2. `Accept-Language`;
3. English fallback.

The root path is an entry point, not canonical content.

## Localized Routes

Use locale-prefixed canonical routes:

```text
/fr/...
/en/...
```

French and English use localized section slugs:

```text
/fr/formation
/en/education
/fr/projets
/en/projects
```

Project slugs are shared across locales in V1.

## Hreflang

Every localized canonical page should output alternate links.

Example for a project:

```html
<link rel="alternate" hreflang="fr" href="https://bwetterwald.fr/fr/projets/project-slug">
<link rel="alternate" hreflang="en" href="https://bwetterwald.fr/en/projects/project-slug">
<link rel="alternate" hreflang="x-default" href="https://bwetterwald.fr/">
```

## Canonical URLs

Each localized page should have a canonical URL pointing to itself.

Avoid canonicalizing French and English pages to one language; they are separate localized documents.

## Localized Metadata

Each route needs:

- localized `<title>`;
- localized meta description;
- localized OpenGraph title and description;
- localized structured data where text appears;
- locale-specific `og:locale`;
- alternate locale references where applicable.

Project metadata should come from `ProjectTranslation.title` and `ProjectTranslation.shortDescription`. `detailedDescription` is optional and must not be required for metadata.

## SSR and Prerendering

Approved main runtime model: Angular request-time SSR.

SEO-critical routes must return meaningful HTML without relying on client-only rendering.

Requirements:

- SSR for dynamic project detail pages;
- dynamic project pages must not require a frontend rebuild simply to become crawlable after project data changes;
- metadata resolved before the HTML response is sent;
- localized 404 pages rendered server-side;
- stable routes may be prerendered only if this provides a clear benefit and does not complicate content updates.

## Dynamic Project Pages

Dynamic project pages require:

- stable shared slugs;
- localized content availability;
- localized metadata;
- correct status filtering so `DRAFT` projects are not public;
- public visibility for `PUBLISHED` and `ARCHIVED` projects;
- 404 for unknown, draft, or untranslated slugs;
- sitemap entries only for public projects with required translations.

Archived projects may have compact detail pages when no detailed description exists.

## Sitemap

Generate `sitemap.xml` with:

- all public localized static routes;
- all public project detail URLs for both locales when required translations exist;
- `PUBLISHED` and `ARCHIVED` project URLs;
- last modification timestamps where reliable;
- alternate language references if the sitemap generation approach supports them.

Sitemap generation can be:

- backend-driven;
- frontend SSR-driven;
- deployment-time generated from the API.

The implementation choice should match the final SSR architecture.

## Robots

Provide `robots.txt` with:

- allowed crawling for public content;
- sitemap location;
- no accidental disallow of localized routes;
- no exposure of private/admin paths if future admin routes exist.

## OpenGraph

Each public page should define:

- `og:title`;
- `og:description`;
- `og:type`;
- `og:url`;
- `og:image` when an approved image exists;
- `og:locale`;
- alternate locales.

Project pages should use the optional project logo/media reference when approved and properly sized. Do not use unapproved portraits or fabricated imagery.

## Structured Data

Potential schema types:

| Page | Structured Data |
| --- | --- |
| Home | `Person` or `ProfilePage` for Baptiste Wetterwald, limited to approved public details. |
| Projects index | `CollectionPage`. |
| Project detail | `CreativeWork` or `SoftwareSourceCode` when appropriate. |
| Breadcrumbs | `BreadcrumbList`. |

Known approved identity details may be used: Baptiste Wetterwald, Software Engineer, graduated Engineer in Computer Science and Networks. Do not publish unapproved location, employer claims beyond the content inventory, social URLs, images, or contact details.

## Semantic HTML

Requirements:

- one logical `h1` per page;
- semantic `nav`, `main`, `section`, `article`, `footer`;
- sonar/compass navigation built around real anchors;
- project cards should use real links;
- timelines should remain readable as lists or sections;
- buttons only for actions, links for navigation;
- form labels explicitly associated with inputs when contact form exists.

## Keyboard Navigation

Requirements:

- skip link to main content;
- all interactive elements reachable by keyboard;
- visible focus state;
- logical tab order;
- no keyboard trap in mobile navigation or motion components;
- escape closes menus/dialogs where applicable;
- carousel-like behavior should be avoided unless explicitly justified.

## Screen Readers

Requirements:

- accessible names for icon buttons;
- `aria-current` for active navigation;
- clear language attributes on localized pages;
- decorative graphics hidden from assistive tech;
- meaningful alt text for content images;
- polite live regions only for important asynchronous state changes.

## Visible Focus

Focus indicators must:

- have sufficient contrast in both themes;
- not rely on color alone;
- remain visible on custom maritime controls;
- work with keyboard and high-contrast user settings where possible.

## Reduced Motion

Respect `prefers-reduced-motion`.

Reduced motion mode should:

- disable looping waves, sonar pulses, sweeping beams, and parallax;
- keep state changes understandable through static visual indicators;
- preserve all navigation and content access.

## Accessible Fallback Navigation

The sonar/compass navigation must have a conventional fallback:

- real anchor links in the DOM;
- no canvas-only navigation;
- no motion-dependent target discovery;
- no fake telemetry labels as the only navigation text.

## Validation Direction

When implementation starts, validate with:

- automated accessibility checks;
- keyboard-only walkthrough;
- screen reader smoke testing;
- SSR HTML inspection;
- sitemap and robots inspection;
- metadata inspection for each locale;
- Lighthouse or equivalent SEO/performance checks.

