# Roadmap

This roadmap records what the repository currently implements and what remains. It preserves the original milestone numbering for traceability.

## Current Status

| Milestone                                   | Status                             | Current evidence                                                                                                             |
| ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| M1 Bootstrap                                | Complete                           | Angular/Spring projects, wrappers, formatting/linting configuration, repository layout                                       |
| M2 Health/connectivity                      | Complete                           | Actuator `/api/health`, Angular API URL service, native development proxy                                                    |
| M3 Docker Compose                           | Complete                           | Frontend, backend, PostgreSQL, local networking, health checks, named volume                                                 |
| M4 Persistence/Flyway                       | Complete                           | JPA domain, PostgreSQL repositories, Flyway V1-V8, schema/query tests                                                        |
| M5 FR/EN SSR/SEO foundation                 | Complete                           | Request-time SSR, `/fr` and `/en`, root redirect, runtime i18n, metadata, localized 404s                                     |
| M6 Shell/theme/navigation                   | Complete                           | Semantic shell, locale/theme preferences, accessible header/mobile/footer navigation                                         |
| M7 Projects API/pages                       | Complete                           | Public API, API-backed listing, dedicated `DETAIL` pages, resolver/SSR states                                                |
| M8 Real portfolio content                   | Complete for supplied content      | Profile, skills, languages, education, experience, six seeded projects; unprovided contact/CV/social content remains omitted |
| M9 Visual/page polish                       | Complete                           | daisyUI/custom maritime system, porthole, timelines, card/detail styling                                                     |
| M10 Motion                                  | Complete                           | Native-CSS lighthouse beam, sonar feedback, reduced-motion behavior                                                          |
| M11 GitHub/contact integrations             | Complete                           | GitHub REST/GraphQL activity plus localized Contact form, validated API, bounded abuse protection, and SMTP sender boundary  |
| M12 SEO/accessibility/performance hardening | In progress                        | Metadata, SSR, 404s, crawl discovery, keyboard/reduced-motion coverage exist; structured data and formal audits remain       |
| M13 Production images                       | Complete as a local image baseline | Separate multi-stage non-root Dockerfiles and `.dockerignore` files; registry publishing is M14                              |
| M14 CI                                      | Not started                        | No `.github/workflows` directory                                                                                             |
| M15 VPS deployment                          | Not started                        | No Nginx/HTTPS, GHCR pull, deployment script, or automated rollout                                                           |
| M16 Production hardening                    | Not started                        | No deployed backup/restore, rollback automation, monitoring, or production security verification                             |

The single-page architecture is the approved `main` baseline. It is implemented and validated locally, but it must not be described as production-deployed.

## Post-M10 Candidate Work

Implemented in the current branch:

- persistent compact maritime navigation;
- mobile draggable sonar with edge snapping and viewport-safe inward expansion;
- `/fr` and `/en` single-page portfolio composition;
- stable `#home`, `#education`, `#experience`, `#projects`, and `#contact` links;
- compatibility redirects from former localized section routes;
- explicit fragment/history/focus behavior and passive scroll-spy;
- one persistent lighthouse independent of navigation handoff;
- wide-viewport conventional-header-to-sonar handoff with hysteresis and focus retention;
- anchor-icon permalinks for all major sections;
- restrained daisyUI dividers between major sections;
- expanded unit, SSR smoke, and headless-browser smoke coverage.

The former large header sonar, header lighthouse, dual lighthouse source switching, and Home SVG wave experiment are not part of the candidate architecture.

## M1 — Project and Tooling Bootstrap

Status: complete.

Implemented:

- Angular 22 standalone SSR application;
- Spring Boot Maven project using Java 21;
- Angular ESLint, Prettier, strict TypeScript, and unit-test setup;
- repository/frontend/backend documentation and safe example environment file.

## M2 — Angular and Spring Foundations

Status: complete.

Implemented:

- Spring Boot Actuator health at `/api/health`;
- typed Angular health/API URL services;
- same-origin browser `/api` convention;
- native Angular proxy to `http://localhost:8080`;
- SSR internal-origin support through `BACKEND_INTERNAL_ORIGIN`.

## M3 — Docker and Local Integration

Status: complete.

Implemented:

- `postgres`, `backend`, and `frontend` Compose services;
- loopback-only host bindings;
- persistent `postgres-data` volume;
- dependency-aware health checks;
- frontend SSR `/api` proxy to the backend Compose service.

This is a local integration environment, not a VPS deployment.

## M4 — PostgreSQL, Flyway, and Project Domain

Status: complete.

Implemented:

- projects, translations, technologies, ordered associations, and structured detail sections;
- `DRAFT`, `PUBLISHED`, and `ARCHIVED` statuses;
- independent `CARD_ONLY` and `DETAIL` presentation modes;
- Flyway V1-V8 including constraints and real content seeds;
- Hibernate `ddl-auto=validate`;
- isolated PostgreSQL migration/repository tests.

## M5 — Routing, I18n, and Request-Time SSR

Status: complete, with the route architecture subsequently consolidated by the single-page branch.

Implemented now:

- canonical `/fr` and `/en` request-time SSR documents;
- root HTTP redirect using cookie, `Accept-Language`, then English;
- runtime frontend translations and localized backend project content;
- localized document and project metadata;
- localized 404 responses with SSR status;
- compatibility redirects from the former section routes.

## M6 — Application Shell and Navigation

Status: complete and evolved after M10.

Implemented now:

- reusable localized shell, skip link, header, main, and footer;
- conventional header and mobile-menu section links;
- locale preference switching;
- one persistent lighthouse theme control;
- compact floating sonar with shared semantic fragment links;
- accessible current-location and disclosure states.

## M7 — Project API and Project Pages

Status: complete.

Implemented:

- localized public list, status-filtered list, featured, and detail endpoints;
- exclusion of drafts and rejection of card-only detail requests;
- route resolvers and SSR transfer-cache-compatible data loading;
- featured/published/archived list presentation inside the main document;
- dedicated detail pages with optional media, ordered technologies, localized generic sections, and deprecated body fallback;
- empty, API error, and localized detail-not-found states.

## M8 — Education, Experience, and Content

Status: complete for content currently supplied and published.

Implemented:

- bilingual identity, biography, backend/full-stack positioning, and porthole portrait;
- skills with importance hierarchy and languages with text-based levels;
- five Education and five Professional Experience entries;
- approved local organization/school logo assets and scoped official links;
- six real project records, including two `DETAIL` and four `CARD_ONLY` entries.

Global social links, downloadable CV, and public contact method remain absent because approved values/files have not been supplied. Their absence does not make the implemented content milestone incomplete.

## M9 — Maritime Visual System

Status: complete.

Implemented:

- navy/off-white/cyan/signal-red token system and related light/dark themes;
- selective daisyUI primitives plus custom maritime CSS/SVG;
- porthole portrait;
- route/waypoint Education and Experience timelines;
- project/skill/contact surface hierarchy;
- responsive layouts and visible focus treatment.

Mockup, Aura, and Hover 3D treatments were considered but are not implemented because current content/media does not justify them.

## M10 — Motion

Status: complete.

Implemented:

- one dark-mode rotating lighthouse beam using CSS;
- one-shot sonar marker feedback;
- compact-sonar expansion and header handoff transitions;
- global and component-specific reduced-motion behavior;
- browser-guarded measurement/observer logic.

GSAP was not added. Decorative Home waves, bathymetric drift, parallax, and particles were not retained.

## M11 — GitHub and Contact Integrations

Status: complete in code. Production Contact delivery still requires private deployment configuration and external sender/domain verification.

Implemented:

- fixed-target server-side GitHub REST client for the configured portfolio identity;
- approved `BaptisteWetterwald` global identity enabled by default;
- optional backend-only bearer token, anonymous public-repository operation, and authenticated official GraphQL contribution-calendar query;
- portfolio-owned `GET /api/v1/github/activity` response contract;
- three-item mapping of recently pushed, owner-visible public repositories while excluding forks, archived repositories, disabled repositories, and malformed items;
- compact contribution contract containing total contributions and date/count values for approximately one year;
- thread-safe fixed-cardinality 30-minute in-process component caches, two-minute error retry backoff, partial stale-on-refresh-error fallback, and controlled unavailable state;
- request-time Angular resolver with HTTP transfer caching and a compact localized block after Skills/Languages inside Home;
- native SSR-safe Angular contribution grid with maritime cyan intensity levels, month/weekday context, accessible date/count labels, and calendar-only horizontal scrolling;
- quiet component-level omission when REST or GraphQL data is unavailable, with no page-level failure and no new primary section or navigation waypoint;
- localized, accessible typed reactive Contact form inside the existing `#contact` section;
- normalized Jakarta Bean Validation request contract and `POST /api/v1/contact` with stable `204`, `400`, `429`, `502`, and `503` behavior;
- `ContactMessageSender` boundary with safe local logging, explicit disabled mode, and production SMTP delivery using fixed configured `From`/`To` identities plus visitor `Reply-To`;
- bounded salted in-memory per-client sliding-window limiting and an assistive-technology-safe decoy field;
- no Contact persistence and no exposure or logging of submitted content, private identities, credentials, or provider responses.

Production configuration remaining outside source control:

- production provisioning of the optional backend-only token needed to populate the GraphQL contribution calendar; repositories work anonymously without it;
- private Contact recipient and fixed sender identity;
- SMTP provider credential and sender/domain DNS verification;
- trusted Nginx forwarding configuration and production-only `SERVER_FORWARD_HEADERS_STRATEGY=native`;
- owner-approved site-wide privacy/legal wording, if desired. The implementation documents its actual minimal data flow without inventing policy or retention promises.

Project-specific GitHub links stored in seeded data remain static content and are separate from this API integration.

## M12 — SEO, Accessibility, and Performance Hardening

Status: in progress.

Already implemented:

- request-time localized SSR;
- localized metadata, canonical and translation-accurate `hreflang` links, OpenGraph metadata;
- localized SSR 404/noindex behavior for missing or non-public content and distinct HTTP 503/noindex behavior for bounded project-backend failures;
- permanent compatibility redirects to section fragments while locale negotiation at `/` remains temporary;
- dynamic backend-owned localized `sitemap.xml` and a public `robots.txt` crawl policy;
- semantic navigation/content, keyboard states, focus handling, and reduced motion;
- unit, SSR smoke, and responsive headless-browser checks.

Remaining:

- approved JSON-LD structured data;
- approved site-wide OpenGraph imagery;
- formal keyboard, screen-reader, contrast, zoom/reflow, and Lighthouse-style audits;
- agreed performance/accessibility thresholds and remediation.

## M13 — Production Docker Images

Status: complete as an image baseline; production publication/operation remains later work.

Implemented:

- separate multi-stage frontend SSR and backend Dockerfiles;
- versioned Node 24.19.0 and Java 21 runtime bases;
- lockfile/wrapper-driven builds;
- minimal runtime contents;
- non-root runtime users;
- runtime environment configuration;
- `.dockerignore` coverage;
- Compose health checks.

Remaining outside M13: immutable registry publishing, production deployment configuration, and deployed verification.

## M14 — CI

Status: not started.

Required:

- GitHub Actions frontend install/format/lint/test/build validation;
- backend test/compile/package validation with PostgreSQL;
- image builds and GHCR publishing only after validation;
- immutable Git-SHA tags and secure credentials.

## M15 — Automated VPS Deployment

Status: not started.

Required:

- host Nginx and HTTPS for `bwetterwald.fr`;
- production Compose/environment configuration;
- authenticated GHCR pulls;
- controlled frontend/backend update;
- startup migration coordination;
- public health verification and deployment traceability;
- rollback to prior compatible image versions.

## M16 — Production Verification and Hardening

Status: not started.

Required:

- HTTPS/security-header and exposed-port review;
- PostgreSQL backup schedule and tested restore;
- tested application rollback with migration compatibility;
- logging and basic monitoring;
- secrets/permissions review;
- documented operational recovery procedure.
