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

Milestone 5 implements this as a real HTTP 302 in the built Express SSR server. The redirect priority is:

1. explicit preference from the `portfolio_locale` cookie;
2. `Accept-Language`;
3. English.

The locale switcher persists explicit browser choices in `localStorage` under `portfolio.locale` and mirrors the value to the cookie so future SSR requests can honor it. No geolocation is used.

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

Milestone 5 implements the static canonical route set:

```text
/fr
/fr/formation
/fr/experience
/fr/projets
/fr/contact
/en
/en/education
/en/experience
/en/projects
/en/contact
```

Unsupported locale prefixes are not normalized to English; they render not-found behavior.

## Hreflang

Every localized canonical page should output alternate links.

Example for a project:

```html
<link
  rel="alternate"
  hreflang="fr"
  href="https://bwetterwald.fr/fr/projets/project-slug"
/>
<link
  rel="alternate"
  hreflang="en"
  href="https://bwetterwald.fr/en/projects/project-slug"
/>
<link rel="alternate" hreflang="x-default" href="https://bwetterwald.fr/" />
```

Milestone 5 emits `fr`, `en`, and `x-default` alternates for equivalent static pages. `x-default` points to `https://bwetterwald.fr/`, and each localized page canonicalizes to itself.

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

Milestone 5 metadata is centralized in `PageMetadataService`. Static placeholder pages receive SSR-rendered localized title, description, canonical URL, OpenGraph title/description/url/type/locale, and alternate locale metadata. Structured data is intentionally deferred until approved personal/project content exists.

## SSR and Prerendering

Approved main runtime model: Angular request-time SSR.

SEO-critical routes must return meaningful HTML without relying on client-only rendering.

Requirements:

- SSR for dynamic project detail pages;
- dynamic project pages must not require a frontend rebuild simply to become crawlable after project data changes;
- metadata resolved before the HTML response is sent;
- localized 404 pages rendered server-side;
- stable routes may be prerendered only if this provides a clear benefit and does not complicate content updates.

Milestone 5 keeps request-time SSR as the runtime model with Angular server routes using `RenderMode.Server`. The production build reports `Prerendered 0 static routes`.

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

Dynamic project pages were not implemented in Milestone 5 because the public project REST API was a later milestone. At that stage, project-detail-like URLs returned localized not-found content rather than placeholder project data.

Milestone 7 implements dynamic project pages through request-time SSR:

- `/fr/projets/:slug` and `/en/projects/:slug` load project detail data from the backend API before rendering;
- `PUBLISHED` and `ARCHIVED` projects are crawlable when the requested translation exists;
- unknown, `DRAFT`, non-public, and untranslated project detail requests render localized not-found content and set SSR HTTP 404 where Angular SSR handles the request;
- project detail metadata comes from the localized project title and short description;
- project detail `hreflang` alternates are emitted only for locales returned by the API in `availableLocales`;
- `detailedDescription` is optional and is not required for rendering or metadata.

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

| Page           | Structured Data                                                                        |
| -------------- | -------------------------------------------------------------------------------------- |
| Home           | `Person` or `ProfilePage` for Baptiste Wetterwald, limited to approved public details. |
| Projects index | `CollectionPage`.                                                                      |
| Project detail | `CreativeWork` or `SoftwareSourceCode` when appropriate.                               |
| Breadcrumbs    | `BreadcrumbList`.                                                                      |

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

Milestone 6 adds a reusable localized shell with semantic `header`, `nav`, shell-owned `main`, and `footer` landmarks. Page placeholders and localized 404 content render as sections inside the shell main region. The sonar/compass enhancement is built from real Angular router links plus decorative SVG marked `aria-hidden="true"`.

## Keyboard Navigation

Requirements:

- skip link to main content;
- all interactive elements reachable by keyboard;
- visible focus state;
- logical tab order;
- no keyboard trap in mobile navigation or motion components;
- escape closes menus/dialogs where applicable;
- carousel-like behavior should be avoided unless explicitly justified.

Milestone 6 keyboard behavior:

- the skip link targets `#main-content`;
- all conventional, mobile, locale, theme, and compass links/buttons are keyboard reachable;
- focus indicators use the semantic focus token in both themes;
- the mobile menu trigger exposes `aria-expanded` and `aria-controls`;
- Escape closes the mobile menu and returns focus to the trigger when appropriate;
- route changes and link activation close the mobile menu;
- no keyboard trap is introduced.

## Screen Readers

Requirements:

- accessible names for icon buttons;
- `aria-current` for active navigation;
- clear language attributes on localized pages;
- decorative graphics hidden from assistive tech;
- meaningful alt text for content images;
- polite live regions only for important asynchronous state changes.

Milestone 5 sets `<html lang="">` per localized SSR response through the centralized metadata service. The minimal locale switcher uses visible text labels and accessible names; it does not rely on icons.

Milestone 6 keeps visible language labels in the locale switcher and adds accessible labels/states for the lighthouse theme button. Primary and compass navigation expose `aria-current="page"` only for exact current static routes. Decorative compass SVG and lighthouse visual spans are hidden from assistive technologies.

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

Milestone 6 does not add looping motion. Component CSS includes reduced-motion safeguards, and the compass remains usable as static links.

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
