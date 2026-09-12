# Frontend Architecture

This document describes the Angular implementation on the current single-page candidate branch.

## Stack and Runtime

- Angular 22 standalone components and Angular Router;
- TypeScript 6 in strict mode;
- request-time Angular SSR with hydration and event replay;
- RxJS for resolver/service flows and signals for local/shared UI state;
- Tailwind CSS 4 and daisyUI 5 with custom maritime CSS/SVG;
- Angular's unit-test builder with Vitest/jsdom;
- Express-based SSR server and same-origin API proxy.

Exact package versions belong to `package-lock.json`. Angular CLI's current Node engine range is `^22.22.3 || ^24.15.0 || >=26.0.0`; the frontend container uses Node 24.19.0.

All public Angular server routes use `RenderMode.Server`; no routes are prerendered.

## Route Model

Canonical localized documents:

```text
/fr
/en
```

Each route activates `PublicLayoutComponent`, then one `PortfolioPageComponent` containing:

```text
#home
#education
#experience
#projects
#contact
```

The localized root route runs `projectsResolver` and `githubActivityResolver` before activation. This makes API-backed project cards and available supporting GitHub data part of the complete SSR document.

Former section routes remain in the route table only as compatibility redirects:

```text
/fr/formation  -> /fr#education
/fr/experience -> /fr#experience
/fr/projets    -> /fr#projects
/fr/contact    -> /fr#contact
/en/education  -> /en#education
/en/experience -> /en#experience
/en/projects   -> /en#projects
/en/contact    -> /en#contact
```

The built SSR server returns these architecture migrations as permanent HTTP 308 redirects. The locale-negotiating root `/` remains a temporary HTTP 302 because its target depends on the locale cookie and `Accept-Language`.

Dedicated project pages remain:

```text
/fr/projets/:slug
/en/projects/:slug
```

`app.routes.server.ts` covers the root, localized documents, compatibility paths, project details, and wildcard 404s in server mode. Fragments never reach the server; browser-side fragment handling occurs after hydration.

## Layout and Composition

`PublicLayoutComponent` owns the reusable localized shell:

- skip link and `SiteHeaderComponent`;
- one persistent `LighthouseBeamComponent`;
- `MaritimeFloatingControlsComponent` containing the compact sonar and lighthouse;
- one `<main id="main-content">` router outlet;
- `SiteFooterComponent`.

`PortfolioPageComponent` composes the existing Home, Education, Experience, Projects, and Contact components. Those section components own their stable IDs and retain their internal semantic structure. Four decorative daisyUI dividers separate them. GitHub activity is an internal Home block after Skills/Languages and before the first divider; it has no stable fragment, permalink, header/footer link, or sonar waypoint.

Project details are not composed into the main document. They reuse the same public layout and project navigation state but render through `ProjectDetailPageComponent`.

## Section Navigation Service

`PortfolioNavigationService` is the shared contract for header, mobile menu, sonar, footer, project recovery links, and section permalinks.

It provides:

- localized `/{locale}#{section}` hrefs;
- shared active-section signal state;
- plain-primary-click enhancement through Angular Router;
- native smooth or instant `scrollIntoView` according to intent and motion preference;
- optional keyboard focus movement to section roots.

Modified clicks and SSR are not intercepted, so the anchors retain normal platform behavior.

`PortfolioPageComponent` initializes fragment navigation after render, rechecks initial deep links after browser restoration, handles back/forward without new history writes, and observes the five section roots for passive scroll-spy. Scroll-spy changes state only; it never replaces the current URL fragment.

## Header, Sonar, and Footer

`SiteHeaderComponent` contains conventional desktop section navigation, locale switching, and a conventional mobile menu. It contains no sonar and no lighthouse.

On wide viewports, `PublicLayoutComponent` observes the header and applies a two-threshold visibility handoff:

- header navigation remains primary near the top;
- compact sonar becomes primary after the header moves sufficiently above the viewport;
- the state between the thresholds is retained as hysteresis.

Outgoing navigation is inert/hidden from assistive technology unless it already contains focus. This avoids forced focus movement during handoff.

On narrow viewports, the compact sonar is active from initial render. `SonarNavigationComponent` supports pointer dragging for the collapsed bubble, safe-area clamping, left/right edge snapping, a lighthouse avoidance zone, and an inward viewport-constrained expanded panel. It also expands through hover, focus, click, or tap as appropriate and closes on Escape or navigation.

`SiteFooterComponent` exposes conventional text links to all five fragments.

## Theme and Motion

`ThemePreferenceService` resolves an explicit `portfolio.theme` local-storage value or `portfolio_theme` cookie, then the browser system preference, then light. It applies `<html data-theme>` and `color-scheme`. The inline bootstrap in `index.html` avoids a pre-hydration theme flash.

Only one `LighthouseThemeToggleComponent` is rendered, inside persistent floating controls. `LighthouseBeamComponent` always measures that lantern after hydration. Dark mode runs one CSS beam rotation; light mode hides it; reduced motion keeps a static beam.

`MotionPreferenceService` wraps `prefers-reduced-motion` for TypeScript behavior. Global and component CSS provide static fallbacks. GSAP is not installed.

## Localization

Supported locales are centralized in `core/i18n/locales.ts`. Runtime UI dictionaries live in `core/i18n/translations.ts`; `TranslationService` resolves labels without an external i18n dependency.

Typed profile content under `core/content` separates shared facts/order from localized copy. Project translations come only from the backend API.

The root redirect uses explicit preference, `Accept-Language`, then English. Locale switching:

- preserves recognized main-document fragments;
- preserves a project slug when the target detail translation exists;
- falls back to the target locale's `#projects` section when it does not.

## Metadata and SSR Errors

`PageMetadataService` applies HTML language, title, description, robots, canonical, `hreflang`, OpenGraph URL/title/description/type/locale, alternate OpenGraph locales, and one managed OpenGraph/Twitter social-card group.

The composed document applies Home/document metadata once, canonicalizing to `/fr` or `/en`. Section fragments do not receive separate metadata documents. Its French/English alternates retain the root `x-default`. Project details use the localized API title/short description and advertise only returned `availableLocales`: bilingual details emit reciprocal French and English links, single-language details emit only their available locale, and project details never emit `x-default`.

Healthy main documents and public project details use the same language-neutral `1200 × 630` PNG at `/assets/social/baptiste-wetterwald-social-card-v1.png`. Its absolute production URL is derived by the existing metadata origin helper; project `logoMediaRef` is not used for social sharing. The versioned filename permits future cache-safe replacement because public static assets receive long-lived cache headers. SSR emits the final OpenGraph image/site-name and Twitter card fields before hydration. Client navigation replaces their localized title, description, and alt text, while 404, untranslated-detail, and temporary 503 states remove the whole managed group.

Healthy `/fr` and `/en` documents also receive one managed, SSR-rendered JSON-LD `ProfilePage` whose localized page identity contains a shared `Person` identity. The Person name and job title come from typed localized profile content, the description reuses the localized Home metadata description, and the portrait plus approved GitHub `sameAs` URL come from locale-neutral frontend profile configuration. The stable GitHub identity is independent of the optional activity API response. Project details, 404s, and temporary 503 states remove the managed script so client navigation cannot retain stale profile data.

M12 deliberately implements no project structured-data type. `SoftwareSourceCode` may be reconsidered only after `githubUrl` has a formal public-source guarantee, programming languages are explicitly classified, and repository data is verified. `CreativeWork` and other project-schema fallbacks are intentionally omitted.

Wildcard and invalid, missing, non-public, `CARD_ONLY`, or untranslated project-detail rendering sets SSR HTTP 404 through `RESPONSE_INIT`, uses localized copy, emits `noindex,follow`, and removes managed canonical/hreflang links. A project-detail backend failure or five-second resolver timeout instead renders localized generic temporary-unavailable content with HTTP 503 and the same noindex/no-canonical/no-hreflang protections; backend and network details are not exposed.

The Express server serves the version-controlled `robots.txt` with a short cache policy and generates `sitemap.xml` from the backend-owned French and English public project indexes. Sitemap generation requires `BACKEND_INTERNAL_ORIGIN` at runtime and bounds each parallel localized backend request to five seconds. The sitemap lists the two canonical portfolio documents and only public `DETAIL` project translations; malformed, private, and `CARD_ONLY` candidates are excluded without duplicating project content in Angular. Successful sitemap cache headers enable downstream browser or proxy caching; the SSR application does not keep an internal sitemap cache.

## Project Data Flow

`ProjectApiService` centralizes these calls:

```text
GET /api/v1/projects?locale=fr|en
GET /api/v1/projects?locale=fr|en&status=PUBLISHED|ARCHIVED
GET /api/v1/projects/featured?locale=fr|en
GET /api/v1/projects/{slug}?locale=fr|en
```

`BackendApiUrlService` keeps browser URLs same-origin under `/api`. During SSR it uses `BACKEND_INTERNAL_ORIGIN` when configured, otherwise the incoming origin. The Express SSR server also proxies browser `/api/*` to that internal origin in Compose.

Resolvers expose loaded/error states for the list and loaded/not-found/error states for details. The detail resolver rejects syntactically invalid public slugs locally and bounds backend resolution to five seconds; backend 404 maps to not-found, while network, upstream, and timeout failures remain temporary error states. During SSR, `BackendApiUrlService` resolves the configured `BACKEND_INTERNAL_ORIGIN`. Angular HTTP transfer cache avoids an unnecessary duplicate fetch after hydration when possible.

`GitHubActivityApiService` calls only `GET /api/v1/github/activity` with Angular HTTP transfer caching. Its root-route resolver validates repository URLs plus the bounded calendar date/count contract and converts unavailable, empty, malformed, or failed responses into a quiet unavailable state. Home renders nothing for that state, so GitHub never replaces or gates the identity, skills, languages, or later sections.

`GitHubContributionCalendarComponent` is a native, SSR-safe Angular renderer rather than an imperative chart dependency. It groups at most 400 validated days into Sunday-based week columns, derives four cyan intensity levels from positive counts, and renders a localized approximately 53-by-7 grid before the existing repository cards. The calendar scrolls horizontally inside its own bounded region on narrow viewports and uses a guarded after-render adjustment to show the most recent weeks first. Its scroll container is the single keyboard stop; date/count descriptions are exposed on non-focusable cells so the graph does not add hundreds of tab stops. Missing contribution data removes only the calendar while repositories remain useful.

Project cards render public status/presentation fields from the API. `DETAIL` adds the localized detail action; `CARD_ONLY` does not. Detail pages prefer ordered localized sections and fall back to deprecated `detailedDescription` only when sections are empty.

## Contact Submission Flow

`ContactPageComponent` remains the fifth section of the composed `/fr` and `/en` document; it does not introduce a route or resolver. It uses Angular's typed reactive forms and the existing HTTP configuration:

```text
visitor form -> ContactApiService -> POST /api/v1/contact -> backend delivery boundary
```

The visible form fields are name, email, subject, and message. The client trims values before submission and mirrors the backend's limits: name 100, email 254, subject 160, and message 20–5,000 characters. A fifth `organizationWebsite` control is visually clipped, hidden from assistive technology, removed from tab order, and must remain empty; it is only a low-cost decoy and is not treated as complete bot protection.

Submission state is component-local: idle, invalid, submitting, success, rate limited, or failure. Invalid controls are announced only after touch or attempted submit. A pending request disables the button; success resets the form only after backend `204`; `429` receives distinct localized feedback; all other failures preserve input and use generic copy. The async interaction starts only from a user event and uses no browser globals, so static form markup remains SSR/hydration safe.

## Content Ownership

Frontend/version-controlled content:

- profile/hero and portrait metadata;
- Education and Experience;
- Skills and Languages;
- school/organization logos and official links.

Backend/PostgreSQL content:

- projects and translations;
- statuses, presentation modes, and ordering;
- technologies and optional project links/media;
- localized detail sections.

Do not introduce a frontend project fixture as public content or move static CV/profile facts into persistence without a new requirement.

## Accessibility Contracts

- one document `h1` in the Home hero and `h2` headings for major composed sections;
- semantic header/nav/main/section/article/footer landmarks;
- real anchors for all navigation targets;
- visible focus and no keyboard traps;
- mobile menu `aria-expanded`/`aria-controls`, Escape close, and focus restoration;
- sonar expansion state and active location exposed accessibly;
- decorative sonar SVG, beam, and dividers hidden from assistive technology;
- section roots focusable programmatically with `tabindex="-1"`;
- localized section-permalink labels;
- Contact labels bound to controls, delayed `aria-invalid`/`aria-describedby` errors, live async status, and non-color-only feedback;
- reduced-motion fallbacks for every animated behavior.

## Validation

Unit/integration tests cover routing, redirects, fragment preservation, metadata, SSR guards, project resolvers/pages, Contact validation/submission states, header/sonar handoff, focus retention, mobile drag/snap geometry, theme/beam behavior, and section permalinks/dividers.

`npm run smoke:ssr` validates built request-time responses and project data. `npm run smoke:browser` uses installed headless Chrome through CDP to validate wide/mobile navigation, fragments, history, viewport safety, reduced motion, and visual structure.

Standard validation is `npm run format:check`, `npm run lint`, `npm test`, and `npm run build`.
