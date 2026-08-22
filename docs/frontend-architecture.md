# Frontend Architecture

This document proposes the Angular architecture. No Angular project has been initialized yet.

## Objectives

- Serve a bilingual portfolio for Baptiste Wetterwald with strong SEO.
- Present Software Engineer - Backend / Full-stack positioning clearly.
- Use sonar/compass navigation as a primary visual navigation concept while preserving semantic links.
- Consume public project data from the Spring Boot API.
- Support localized routes, localized metadata, request-time SSR, accessible navigation, and future restrained motion.
- Keep application architecture proportionate to a personal portfolio.

## Application Shape

Use a single Angular application with:

- standalone components;
- Angular Router;
- route-level lazy loading where it keeps bundles small;
- request-time Angular SSR as the main runtime model;
- optional prerendering only for stable routes when it provides a clear benefit;
- design tokens exposed as CSS custom properties;
- service-based API access.

## Routing

Route definitions should mirror the information architecture:

```text
/:locale
/:locale/formation | /:locale/education
/:locale/experience
/:locale/projets | /:locale/projects
/:locale/projets/:slug | /:locale/projects/:slug
/:locale/contact
```

The router should validate `locale` as `fr` or `en`. Route config can map localized path segments to common page components.

Root `/` redirects using:

1. stored explicit language preference when available;
2. `Accept-Language`;
3. English fallback.

## SSR and Prerendering

Approved V1 runtime model: Angular request-time SSR.

Requirements:

- dynamic project pages must be crawlable without requiring a frontend rebuild after project data changes;
- project detail data and metadata should be resolved before SSR sends HTML;
- stable routes such as Home, Education, Experience, Projects, and Contact may be prerendered only if it improves performance without complicating content updates;
- the frontend SSR runtime must call the backend over the internal Docker network in production;
- client-side navigation should hydrate cleanly and reuse the same route/data contracts.

This implies the production frontend image should run an SSR-capable Angular server runtime, not only static files.

## I18n

Approved V1 approach:

- canonical `/fr/...` and `/en/...` routes;
- localized static route segments;
- runtime UI translations in Angular;
- localized project content from the backend;
- shared project slug across locales in V1.

Backend project translations should not be stored in frontend translation files.

## Localized SEO Metadata

Create a metadata service responsible for:

- localized page titles;
- localized descriptions;
- canonical URLs on `https://bwetterwald.fr`;
- `hreflang` alternates;
- OpenGraph metadata;
- project detail metadata from API data;
- fallback metadata for loading/error states.

Metadata should be resolved before SSR completes for SEO-critical routes.

Project metadata must work when `detailedDescription` is absent. `title` and `shortDescription` are the required fields.

## API Consumption

Use typed Angular services for backend calls.

Milestone 2 decision: centralize backend API URL resolution in Angular and keep browser requests same-origin through `/api`. During SSR, the same resolver may use `BACKEND_INTERNAL_ORIGIN` for an internal backend origin; otherwise it falls back to the incoming request origin. The initial typed service calls Actuator health at `GET /api/health` only.

Milestone 3 keeps that resolver as the single Angular-side source of backend URL resolution. In Docker Compose, the frontend SSR runtime receives:

```text
BACKEND_INTERNAL_ORIGIN=http://backend:8080
```

The built SSR server also proxies browser-facing `/api/*` requests to `BACKEND_INTERNAL_ORIGIN`. This is local integration behavior that preserves browser same-origin API calls and avoids adding production Nginx configuration before the deployment milestone. Native `ng serve` development continues to use `frontend/proxy.conf.json` and is unchanged.

Initial public endpoints expected:

```text
GET /api/v1/projects?locale=fr|en
GET /api/v1/projects?locale=fr|en&status=PUBLISHED
GET /api/v1/projects?locale=fr|en&status=ARCHIVED
GET /api/v1/projects/featured?locale=fr|en
GET /api/v1/projects/{slug}?locale=fr|en
GET /api/v1/technologies
```

Frontend behavior:

- `DRAFT` projects are never public and should behave as 404;
- `PUBLISHED` projects are public and may be featured;
- `ARCHIVED` projects are public but belong to an older/secondary archive;
- archived projects may render compact detail pages when no detailed description exists.

Frontend services should:

- centralize base API URL configuration;
- return typed DTOs;
- handle 404 project responses cleanly;
- expose loading and error state to page components;
- avoid leaking server-only secrets into the client bundle.

## State Management

No application-level state management library is justified for V1.

Use:

- route params for current locale and slug;
- Angular services for API access;
- component state or signals for local UI state;
- a small theme preference service for light/dark mode;
- browser storage only for non-sensitive preferences.

Reconsider a state library only if the app develops complex cross-page editing, authenticated sessions, offline workflows, or deeply shared mutable state.

## Component Structure

Proposed component groups:

| Group | Examples |
| --- | --- |
| App shell | Header, footer, skip link, locale switcher, lighthouse theme toggle. |
| Navigation | Semantic nav links, sonar/compass visual navigation, mobile nav. |
| Content | Page heading, section heading, nautical timeline, content block. |
| Home | Hero, portrait/porthole slot, technology highlights, featured work, contact CTA. |
| Projects | Project card, logo/media display, technology list, project link set. |
| Feedback | Loading state, empty state, error state, not-found view. |
| SEO | Metadata helpers, structured data helpers. |

Components should remain accessible without motion effects.

## Design Tokens

Expose design foundations through CSS custom properties:

```text
--color-bg
--color-text
--color-surface
--color-border
--color-focus
--color-accent-maritime
--color-accent-signal
--space-*
--radius-*
--shadow-*
```

Angular components should consume semantic tokens, not hard-coded primitive colors.

## Theme Handling

Use a theme service that:

- reads explicit preference from local storage;
- falls back to `prefers-color-scheme`;
- sets a root attribute such as `data-theme`;
- updates accessible label/state on the theme toggle.

The lighthouse theme toggle must remain a standard interactive control underneath the visual treatment.

Light and dark themes are related but not simple inversions.

## Responsive Navigation

Requirements:

- sonar/compass navigation enhances real route links;
- conventional links remain available in SSR HTML;
- desktop layout can emphasize the compass/rose des vents concept;
- mobile layout may simplify the visual treatment but must retain the same links;
- no keyboard trap;
- escape key closes menus;
- `aria-expanded` and `aria-controls` on menu trigger;
- route changes close mobile navigation;
- compass/sonar visuals do not hide actual links from assistive technology.

## Loading and Error States

For project pages:

- SSR should return complete content when possible.
- Client navigation can show skeleton or stable loading state.
- 404 project responses should render localized not-found content.
- API failures should provide a localized retry path and link to Projects.
- Archived projects without detailed descriptions should render a complete compact page rather than an error.

Do not let loading labels resize cards or navigation controls.

## Image and Media Handling

V1 media modelling is intentionally minimal.

Project records may provide one `logoMediaRef` or general media reference. The frontend should treat it as an optional display asset, not as evidence of a full media gallery domain.

Frontend requirements:

- responsive image sizes;
- explicit width/height or aspect ratio to prevent layout shift;
- meaningful alt text when the media conveys content;
- empty alt text for purely decorative textures;
- optimized OpenGraph image assets when approved;
- lazy loading for non-critical images;
- eager loading for critical first-viewport portrait/hero media if used.

## Future Animations

Prepare animation boundaries without implementing them:

- define reduced-motion behavior globally;
- isolate motion-heavy visual components behind clear APIs;
- prefer CSS transitions and SVG animation;
- reserve GSAP for choreography that CSS/SVG cannot maintain cleanly.

## Testing Direction

When bootstrapped later, frontend validation should include:

- unit tests for services and pure helpers;
- route/metadata tests for localized URLs;
- accessibility checks for navigation and theme controls;
- SSR smoke tests for project pages;
- production build validation.

## Milestone 1 Bootstrap Decisions

- Angular 22 is the frontend baseline. Angular 21 was used only during the initial scaffold because the then-selected local Node runtime did not satisfy Angular 22's engine requirement.
- Angular 22 requires Node.js `^22.22.3 || ^24.15.0 || >=26.0.0` and TypeScript `>=6.0.0 <6.1.0`.
- The scaffold uses Angular's standalone component architecture, Angular Router, and request-time SSR support.
- Tailwind CSS 4 and DaisyUI 5 are installed for the approved future styling direction, but final design tokens and portfolio UI are not implemented yet.
- Angular ESLint and Prettier provide the frontend linting and formatting baseline.
- The generated demo UI was replaced with a neutral scaffold placeholder.
- Angular SSR allowed hosts include `localhost`, `127.0.0.1`, `bwetterwald.fr`, and `www.bwetterwald.fr` so local SSR validation and the approved production host are accepted.
