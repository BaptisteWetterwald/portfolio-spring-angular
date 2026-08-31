# Frontend Architecture

This document describes the Angular architecture and milestone implementation decisions.

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

### Milestone 5 Routing Implementation

Milestone 5 implements the static public route tree from a small typed route model in `frontend/src/app/core/routing/localized-routes.ts`. The Angular route config is generated per supported locale so the mapping remains explicit without copy-pasting two full route hierarchies.

Implemented canonical static routes:

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

Only `fr` and `en` are supported locale prefixes. Unsupported prefixes such as `/de` and `/es/projects` fall through to not-found handling instead of rendering English content.

Project detail URL helpers preserve equivalent-locale switching with shared V1 slugs. Milestone 7 wires those helpers into real project detail routes and API-backed data loading.

## SSR and Prerendering

Approved V1 runtime model: Angular request-time SSR.

Requirements:

- dynamic project pages must be crawlable without requiring a frontend rebuild after project data changes;
- project detail data and metadata should be resolved before SSR sends HTML;
- stable routes such as Home, Education, Experience, Projects, and Contact may be prerendered only if it improves performance without complicating content updates;
- the frontend SSR runtime must call the backend over the internal Docker network in production;
- client-side navigation should hydrate cleanly and reuse the same route/data contracts.

This implies the production frontend image should run an SSR-capable Angular server runtime, not only static files.

Milestone 5 keeps `outputMode: "server"` and configures all public routes with `RenderMode.Server`. The production build prerenders zero static routes, so public pages are rendered at request time.

## I18n

Approved V1 approach:

- canonical `/fr/...` and `/en/...` routes;
- localized static route segments;
- runtime UI translations in Angular;
- localized project content from the backend;
- shared project slug across locales in V1.

Backend project translations should not be stored in frontend translation files.

Milestone 5 uses a lightweight Angular-native runtime translation layer:

- supported locales are centralized in `core/i18n/locales.ts`;
- translation dictionaries live in `core/i18n/translations.ts`;
- components resolve copy through `TranslationService` instead of inline locale conditionals;
- `LocaleContextService` exposes the current locale as a signal;
- no external i18n dependency was added.

The initial dictionaries only cover the routing shell, locale switcher, metadata, placeholders, and 404 text. Dynamic backend project translations are deliberately not represented in frontend translation files.

Milestone 8 adds structured frontend-owned static content for biography, Education, Experience, Skills, and Languages under `core/content`. Locale-neutral facts such as timeline IDs, date values, locations, shared technologies, skill group/domain/technology ordering, importance classifications, organization names, logo paths, and official links are centralized, while localized human-readable copy stays per locale. Project content remains backend-owned.

## Localized SEO Metadata

Create a metadata service responsible for:

- localized page titles;
- localized descriptions;
- canonical URLs on `https://bwetterwald.fr`;
- `hreflang` alternates;
- OpenGraph metadata;
- project detail metadata from API data;
- fallback metadata for error and not-found states.

Metadata should be resolved before SSR completes for SEO-critical routes.

Project metadata must work when `detailedDescription` is absent. `title` and `shortDescription` are the required fields.

Milestone 5 centralizes static page metadata in `PageMetadataService`. It sets localized `<title>`, meta description, robots, canonical URL, `hreflang` alternates for `fr`, `en`, and `x-default`, OpenGraph title/description/type/url/locale, and `<html lang="">` during SSR.

404 pages use localized title/description, `noindex,follow`, OpenGraph URL/locale, and no canonical or `hreflang` links.

Milestone 7 extends `PageMetadataService` for project details:

- localized detail title uses the project title plus site name;
- meta description and OpenGraph description use `ProjectDetailDto.shortDescription`;
- canonical URL uses the localized project detail route and shared slug;
- `hreflang` alternates are emitted only for locales present in `ProjectDetailDto.availableLocales`;
- OpenGraph type is `article` for project detail pages;
- `og:image` is emitted only when `logoMediaRef` is present.

## API Consumption

Use typed Angular services for backend calls.

Milestone 2 decision: centralize backend API URL resolution in Angular and keep browser requests same-origin through `/api`. During SSR, the same resolver may use `BACKEND_INTERNAL_ORIGIN` for an internal backend origin; otherwise it falls back to the incoming request origin. The initial typed service calls Actuator health at `GET /api/health` only.

Milestone 3 keeps that resolver as the single Angular-side source of backend URL resolution. In Docker Compose, the frontend SSR runtime receives:

```text
BACKEND_INTERNAL_ORIGIN=http://backend:8080
```

The built SSR server also proxies browser-facing `/api/*` requests to `BACKEND_INTERNAL_ORIGIN`. This is local integration behavior that preserves browser same-origin API calls and avoids adding production Nginx configuration before the deployment milestone. Native `ng serve` development continues to use `frontend/proxy.conf.json` and is unchanged.

Milestone 5 did not add project API consumption. Milestone 7 adds typed project API consumption while keeping the existing `/api` proxy behavior and health service available.

Initial public endpoints expected:

```text
GET /api/v1/projects?locale=fr|en
GET /api/v1/projects?locale=fr|en&status=PUBLISHED
GET /api/v1/projects?locale=fr|en&status=ARCHIVED
GET /api/v1/projects/featured?locale=fr|en
GET /api/v1/projects/{slug}?locale=fr|en  # only for DETAIL projects
GET /api/v1/technologies
```

Frontend behavior:

- `DRAFT` projects are never public and should behave as 404;
- `PUBLISHED` projects are public and may be featured;
- `ARCHIVED` projects are public but belong to an older/secondary archive;
- `CARD_ONLY` projects appear on public lists but have no detail route affordance;
- `DETAIL` projects appear on public lists and may resolve localized detail pages;
- archived projects may render compact detail pages when no detailed description exists, but only when their presentation mode is `DETAIL`.

Frontend services should:

- centralize base API URL configuration;
- return typed DTOs;
- handle 404 project responses cleanly;
- expose resolved loaded, error, and not-found state to page components;
- avoid leaking server-only secrets into the client bundle.

### Milestone 7 Project API Consumption

Milestone 7 adds a typed project client in `core/projects/project-api.service.ts`.

Implemented methods:

```text
listProjects(locale, status?)
listFeaturedProjects(locale)
getProject(locale, slug)
```

The client reuses `BackendApiUrlService`, so browser requests remain same-origin under `/api` and SSR requests can use `BACKEND_INTERNAL_ORIGIN`. Components do not hard-code backend origins.

Project DTO interfaces live in `core/projects/project.models.ts` and mirror the public backend contracts:

- `ProjectSummaryDto`;
- `ProjectDetailDto`;
- `ProjectSectionDto`;
- `TechnologyDto`;
- `ProjectStatus = "PUBLISHED" | "ARCHIVED"`.
- `ProjectPresentationMode = "CARD_ONLY" | "DETAIL"`.

Route resolvers in `core/projects/project-resolvers.ts` load project data before route activation. Listing resolvers return real post-resolution `loaded` or `error` states. Detail resolvers return `loaded`, `notFound`, or `error` states. They do not synthesize a `loading` state because normal routed rendering waits for resolver completion before activation. Detail 404 responses become a localized not-found state; non-404 failures become a generic API failure state.

Angular HTTP transfer cache is enabled for project GET requests through the normal Angular SSR/hydration path, avoiding a second client fetch after server rendering when Angular can reuse the SSR response.

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

| Group      | Examples                                                                         |
| ---------- | -------------------------------------------------------------------------------- |
| App shell  | Header, footer, skip link, locale switcher, lighthouse theme toggle.             |
| Navigation | Semantic nav links, sonar/compass visual navigation, mobile nav.                 |
| Content    | Page heading, section heading, nautical timeline, content block.                 |
| Home       | Hero, portrait/porthole slot, technology highlights, featured work, contact CTA. |
| Projects   | Project card, logo/media display, technology list, project link set.             |
| Feedback   | Loading state, empty state, error state, not-found view.                         |
| SEO        | Metadata helpers, structured data helpers.                                       |

Components should remain accessible without motion effects.

### Milestone 6 Shell Implementation

Milestone 6 replaces the minimal route placeholder shell with reusable standalone shell components under the localized route parent:

- `PublicLayoutComponent` owns the localized shell boundary and the single `<main id="main-content">` outlet.
- `SiteHeaderComponent` renders the skip link, identity/home link, conventional primary navigation, locale switcher, lighthouse theme control, mobile menu, and desktop compass enhancement.
- `SiteFooterComponent` renders a minimal identity, copyright year, and primary route links. No social links are shown because no real GitHub or LinkedIn URLs are confirmed yet.
- `SonarNavigationComponent` renders the first compass/rose-des-vents visual navigation treatment as semantic links generated from `localized-routes.ts`. Its desktop geometry is intentionally compact and radial so the five destinations read as waypoints around one navigation instrument.
- `LighthouseThemeToggleComponent` renders a real button backed by the theme service.

The shell is not duplicated across locale route trees. Projects is API-backed as of Milestone 7. Home, Education, and Experience receive confirmed static content in Milestone 8; Contact still avoids publishing a fake contact method.

### Milestone 7 Project Pages

Milestone 7 replaces the Projects placeholder with `ProjectsPageComponent` and adds `ProjectDetailPageComponent`.

Implemented localized routes:

```text
/fr/projets
/en/projects
/fr/projets/:slug
/en/projects/:slug
```

The Projects page renders:

- localized heading and short introduction;
- featured `PUBLISHED` projects;
- non-featured `PUBLISHED` projects;
- `ARCHIVED` projects;
- an empty state when no localized public projects exist;
- a generic API failure state if project data cannot be loaded.

Project cards are reusable semantic `article` elements with a title, short description, ordered technology labels, optional archived status badge, optional GitHub/demo links when URLs exist, and a localized detail action only when `presentationMode = "DETAIL"`. `CARD_ONLY` cards stay visually normal but do not link to project detail routes or imply that more page content exists. The card body keeps actions in a stable bottom row when actions exist, without padding `CARD_ONLY` entries with fake content.

The detail page renders only fields present in `ProjectDetailDto`: title, short description, optional media reference, technologies, optional archived status badge, optional external links, and ordered localized sections. A compact technical overview near the hero is derived from the existing technology list and section headings; no separate project-fact metadata model exists yet. `detailedDescription` remains a deprecated fallback and is rendered only when a DETAIL response has no structured sections. Markdown, unsafe HTML, page-builder blocks, and media galleries remain deferred.

Project detail not-found states reuse the localized not-found foundation and set SSR response status 404 through `RESPONSE_INIT` when Angular SSR is handling the request. The generic not-found page links to Home, while project-detail misses link back to the localized Projects page.

### Milestone 8 Static Content Pages

Milestone 8 introduces:

- `HomePageComponent` for identity, backend/full-stack positioning, concise About copy, primary stack highlights, skills/domain presentation, and secondary language facts.
- `EducationPageComponent` for a semantic ordered timeline of ENSISA, UQAC semester, IUT Robert Schuman, INSA Lyon, and Lycée Louis Armand.
- `ExperiencePageComponent` for a semantic ordered timeline of confirmed professional roles.
- `core/content/portfolio-content.models.ts` and `core/content/portfolio-content.ts` as the typed localized static content source.

The static content model supports localized labels, paragraphs, timeline periods with semantic `datetime` values, locations, optional role context, restrained responsibility bullets, technology tags, structured language facts, and optional timeline affiliation metadata for official organization/school links and approved logo assets. Skill topology is built from `skillGroupFacts`, which centralizes group/domain/technology IDs, ordering, membership, and importance values; localized skill copy provides group/domain labels, localized technology labels where needed, notes, and summaries. Skill groups, domains, and individual technologies can carry an importance value: `primary`, `professional-complementary`, `secondary`, or `exploratory-historical`. This keeps primary backend/full-stack skills visually separable from broader professional, enterprise, older, niche, or exploratory knowledge. It deliberately omits unconfirmed social URLs, downloadable CVs, contact methods, project records, unsupported metrics, unpublished supporting documents, and private personal context.

The approved content architecture is hybrid. Identity, biography, Education, Experience, Skills, Languages, skill hierarchy, organization/school logo references, and official organization/school links remain typed, frontend-owned, and version-controlled because they change infrequently and benefit from Git review. Projects remain backend/PostgreSQL-owned with project translations, technologies, publication/archive/featured state, and project-domain media. Do not add profile/CV CMS tables, Education/Experience/Skill/Language database tables, or admin CRUD unless future requirements materially change, such as runtime editing, many dynamic clients, significantly more locales, or external content-management needs.

AI-assisted engineering is represented as a secondary developer-tooling area: ChatGPT, Codex / coding agents, MCP concepts, and early agentic workflow exploration. The content must not position Baptiste as an AI, ML, LLM, agentic AI, or MCP expert.

The pages keep the Milestone 6 shell and visual foundation. Timelines are readable ordered lists with `article` entries and real `<time>` elements; nautical route drawing, waypoint animation, porthole imagery, waves, and GSAP remain deferred.

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

## DaisyUI, Tailwind, and Custom Identity Components

DaisyUI is already installed and should be treated from Milestone 9 onward as the preferred source of reusable UI primitives where its components fit the intended design. The official component catalogue includes primitives such as buttons, badges, cards, fieldsets, inputs, textarea, validator, drawer/menu patterns, Hover 3D Card, and timeline components: <https://daisyui.com/components/>.

The intended split is:

- DaisyUI: reusable UI primitives;
- Tailwind utilities: layout, composition, and adaptation;
- custom CSS/SVG/Angular: distinctive maritime identity and behavior.

Do not make every component DaisyUI. Identity-specific elements such as the sonar/compass navigation, lighthouse theme toggle and future beam, waves, maritime decorative geometry, and bespoke motion should remain custom where DaisyUI cannot reasonably express the design.

The daisyUI Codex plugin documentation says the plugin can provide the latest daisyUI skill and component/theme usage guidance to Codex: <https://daisyui.com/docs/plugin/codex/>. The plugin is not installed in this environment during the M8 refinement pass, and no global Codex configuration should be changed without explicit authorization.

### Milestone 9 Visual System Architecture

Milestone 9 keeps the M6-M8 routing, SSR, content, and project API architecture intact. The work is visual-system implementation, not a content-model or backend redesign.

Component ownership for M9:

| Component area           | DaisyUI role                                                            | Custom role                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Header                   | `navbar`, `menu`, `btn` primitives                                      | responsive shell composition, exact active styles, maritime surface, skip link behavior                                     |
| Footer                   | `footer`, `link` primitives                                             | chart/footer texture, route state, compact identity layout                                                                  |
| Locale switcher          | `join`, `btn` anchors                                                   | locale persistence and current-locale state                                                                                 |
| Lighthouse theme toggle  | `btn` foundation                                                        | lighthouse icon, illuminated lantern, theme service integration; beam deferred                                              |
| Sonar/compass navigation | None for the core instrument                                            | semantic route links, evenly spaced SVG rings, symmetrical axes, active waypoint state                                      |
| Home portrait slot       | None                                                                    | approved portrait displayed in a circular porthole/navigation frame using CSS object cropping from the original image asset |
| Skills                   | `card`, `badge`                                                         | importance classes and hierarchy-specific treatment                                                                         |
| Experience/Education     | `timeline`, `timeline-start`, `timeline-middle`, `timeline-end`, `<hr>` | daisyUI central-route geometry first; custom plotted-route/waypoint styling second                                          |
| Projects                 | `card`, `badge`, `btn`                                                  | featured/standard/archive visual weight, media-safe card presentation, section-based detail case-study rendering            |
| Contact                  | `card`                                                                  | conservative empty public-contact state and lighthouse/contact visual                                                       |

The project card contract remains based on `ProjectSummaryDto`; the detail page remains based on `ProjectDetailDto` with ordered localized `ProjectSectionDto` entries. M9 may style `featured`, `PUBLISHED`, and `ARCHIVED` differently, but it must not add a persistence field solely for visual importance.

Mockup support is architecture-ready but deferred in rendering. The current API exposes only `logoMediaRef`, which may be a logo or other generic media. DaisyUI mockups should only be used when a future media contract or owner-supplied asset identifies browser screenshots, phone screenshots, or code samples.

Hover 3D is deferred because the current cards contain multiple interactive controls. The daisyUI Hover 3D component is appropriate later only for noninteractive showcases or a single whole-card link surface.

Contact remains non-functional until a real public contact method or form backend is approved. M9 may provide a designed page shell, but no fake submission flow, placeholder email, or social URL should be added.

Owner-review correction: Home does not render secondary route cards because they duplicate header navigation, the signature sonar, mobile navigation, and footer links. The Home component may retain localized route-card copy in the content model for now, but it must not render that section unless a later IA decision introduces non-redundant content.

Education and Experience timelines must keep ordered DOM content while using daisyUI's timeline structure for geometry. Desktop alternates entries with `timeline-start` and `timeline-end`; narrow viewports use `max-md:timeline-compact` for one-sided rendering. Custom CSS must not create a separate detached rail.

Timeline affiliation metadata remains frontend-owned static content. Official website URLs are optional and should point to organization or school websites, not LinkedIn substitutes. Logo assets are optional and must only be added when approved files exist. The renderer places logos below the period in the desktop metadata column, reflows them beside the organization or school name on mobile, applies `target="_blank"` plus `rel="noopener noreferrer"` to scoped logo/name links, and leaves the rest of each timeline card non-interactive. Education cards keep a compact metadata/content split. Experience cards keep the metadata/content split only for the header identity area; context, responsibility lists, and technology badges render in a full-width details section below so long professional roles remain readable without changing the daisyUI timeline geometry. The preferred logo asset convention is `frontend/public/assets/logos/<organization-slug>.<ext>`; until existing owner-supplied files are normalized, facts should reference their exact current filenames.

## Theme Handling

Use a theme service that:

- reads explicit preference from local storage;
- falls back to `prefers-color-scheme`;
- sets a root attribute such as `data-theme`;
- updates accessible label/state on the theme toggle.

The lighthouse theme toggle must remain a standard interactive control underneath the visual treatment.

Light and dark themes are related but not simple inversions.

Milestone 6 implements this in `ThemePreferenceService`:

- explicit choices are persisted in browser `localStorage` under `portfolio.theme`;
- explicit choices are mirrored to a non-sensitive `portfolio_theme` cookie so SSR can honor them;
- browser rendering falls back to `prefers-color-scheme` when no explicit choice exists;
- SSR falls back to light when there is no explicit cookie because system preference is not request-visible;
- the resolved theme is applied to `<html data-theme="light|dark">` and `color-scheme`;
- a small inline bootstrap script in `index.html` applies the stored or system theme before Angular hydrates.

No user-preference backend was introduced.

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

Milestone 6 implements conventional navigation in the header and footer, plus a mobile menu controlled by a real button with `aria-expanded` and `aria-controls`. The menu closes on Escape, link activation, and Angular `NavigationEnd`. Focus is moved toward the first mobile link when the menu opens and back to the trigger when Escape or the trigger closes it.

The compass navigation is a desktop-oriented enhancement in the header. It uses SVG/CSS rings and real router links with exact `aria-current="page"` state. The desktop frame stays narrower than the main shell width and positions destinations close to the radar circumference so Home, Education, Experience, Projects, and Contact feel connected to one instrument. On narrow screens, the conventional mobile menu remains the primary navigation path.

## Loading and Error States

For project pages:

- SSR should return complete content when possible.
- Client navigation loading, if added later, should live in the shell/router layer rather than in project resolver result types.
- 404 project responses should render localized not-found content.
- API failures should provide a localized retry path and link to Projects.
- Archived projects without detailed descriptions should render a complete compact page rather than an error.

Do not let any future loading labels resize cards or navigation controls.

## Image and Media Handling

V1 media modelling is intentionally minimal.

Project records may provide one `logoMediaRef` or general media reference. Store public project media refs as canonical root-relative paths beginning with `/`, such as `/assets/projects/my-project/screenshot.webp`, or as approved absolute `https://` URLs. Bare relative paths, protocol-relative URLs, `http://`, and unsafe schemes are rejected. The frontend should treat the reference as an optional display asset, not as evidence of a full media gallery domain.

Project detail layout must remain complete when `logoMediaRef` is absent. The current page does not render an empty media placeholder. Future screenshots or diagrams should be added through an explicit media contract rather than overloading the current single reference.

Frontend requirements:

- responsive image sizes;
- explicit width/height or aspect ratio to prevent layout shift;
- meaningful alt text when the media conveys content;
- empty alt text for purely decorative textures;
- optimized OpenGraph image assets when approved;
- lazy loading for non-critical images;
- eager loading for critical first-viewport portrait/hero media if used.

## Motion Architecture

Milestone 10 adds selected motion without changing the route tree, localized URLs, SSR rendering model, or semantic navigation.

- Reduced motion is handled globally in `frontend/src/styles.css` and specifically in each animated component stylesheet.
- `MotionPreferenceService` reads `prefers-reduced-motion` only in the browser and exposes a signal for components that need a DOM state hook.
- `LighthouseBeamComponent` is a dedicated decorative overlay. It queries the real `data-lighthouse-lantern` element after hydration, derives viewport coordinates with `getBoundingClientRect`, updates CSS custom properties, and observes lantern/header resize, viewport resize, and passive scroll through one requestAnimationFrame-throttled measurement path.
- The lighthouse beam is fixed, `aria-hidden`, pointer-events-none, opacity/transform animated, hidden in light mode, and static under reduced motion.
- Sonar/compass navigation remains semantic router links; motion is limited to one hover/focus marker ripple.
- No ambient wave, parallax, bathymetric drift, path morphing, or replacement background motion is retained for Milestone 10.
- GSAP remains reserved for future choreography that CSS/SVG cannot maintain cleanly; it is not installed for Milestone 10.

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
