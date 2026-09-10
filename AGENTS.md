# Repository architecture

This repository contains an Angular SSR frontend, a Spring Boot backend, and PostgreSQL. Treat the checked-out worktree as the implementation source of truth.

The current single-page candidate architecture is:

- `/fr` and `/en` are the localized portfolio documents.
- Home, Education, Experience, Projects, and Contact are sections with stable IDs `home`, `education`, `experience`, `projects`, and `contact`.
- The GitHub activity block is supporting content inside Home, after the existing skills/languages content. Its optional contribution calendar precedes the repository cards. It is not a sixth section or navigation target.
- Former localized section paths redirect to the corresponding fragment.
- Project `DETAIL` routes remain `/fr/projets/:slug` and `/en/projects/:slug`.
- `CARD_ONLY` projects never receive a public detail affordance or route response.

Do not recreate the former five-primary-page route architecture.

# Content ownership

Frontend-static, typed, version-controlled content under `frontend/src/app/core/content` owns identity, biography, Education, Experience, Skills, Languages, profile/portrait metadata, and organization/school references.

The Spring Boot/PostgreSQL project domain owns projects, translations, publication status, presentation mode, technologies, media references, and ordered localized detail sections. The server-configured GitHub integration owns the approved `BaptisteWetterwald` username, optional token, upstream mapping, and bounded runtime cache; the username must not be inferred from project repository URLs.

Do not invent content, hardcode project records in Angular, or introduce a generic CMS/admin model without a new requirement.

# Navigation and visual system

The top of the page uses conventional header navigation. The header contains neither a sonar nor a lighthouse.

On wide viewports, `PublicLayoutComponent` hands contextual navigation from the header to the compact floating sonar according to header visibility. Preserve the hysteresis behavior and the focus-safe handoff. On narrow viewports the sonar is available immediately as a draggable bubble, snaps to an edge, and expands inward within viewport and lighthouse safe areas.

The footer retains conventional section links. Header, sonar, mobile menu, footer, and section permalinks share `PortfolioNavigationService` and real localized fragment URLs. Passive scroll-spy updates `aria-current="location"` without rewriting URL or history.

There is exactly one persistent floating lighthouse. It is the theme toggle and does not switch sources during header/sonar handoff. Dark-mode beam rotation is native CSS; GSAP is not installed. Do not restore a header lighthouse, dual-source beam logic, a large embedded header sonar, or decorative Home SVG waves.

The visual identity is restrained French Navy/maritime: navy/off-white surfaces, cyan navigation/technical accents, restrained signal red, porthole portrait, sonar waypoints, lighthouse theme control, route-style timelines, anchor permalinks, and daisyUI major-section dividers. Preserve reduced-motion alternatives.

# SSR and browser boundaries

Angular uses request-time SSR (`outputMode: server`, `RenderMode.Server`) and hydration. Browser-only APIs such as `window`, `document` layout measurement, `IntersectionObserver`, `ResizeObserver`, `matchMedia`, pointer capture, animation frames, and scrolling must remain platform-guarded and initialized after render.

The root `/` redirect priority is explicit locale cookie, `Accept-Language`, then English. Browser locale and theme choices are mirrored from local storage into non-sensitive cookies for SSR.

Main-document metadata canonicalizes to `/fr` or `/en`. Project detail metadata is API-derived. Unknown/private/card-only/untranslated project details return localized 404 behavior.

# Backend and persistence

The backend is one feature-oriented modular monolith. Public project APIs live under `/api/v1/projects`; the controlled GitHub activity API is `/api/v1/github/activity`; Actuator health is `/api/health`.

GitHub activity uses the official public-repository REST endpoint plus authenticated GraphQL `contributionsCollection` through a backend-only client, single-identity in-process caches, and partial stale-on-error fallback. The approved username is the default; a blank `PORTFOLIO_GITHUB_USERNAME` disables the feature. `PORTFOLIO_GITHUB_TOKEN` is backend-only and optional: without it, repository activity remains available and the contribution calendar is omitted. Contact posts to `/api/v1/contact`, uses backend-only sender/recipient configuration, delivers through `ContactMessageSender`, and does not persist submissions. Production uses configured SMTP; local development uses the metadata-only logging sender.

`DRAFT` is private. `PUBLISHED` and `ARCHIVED` are public. `DETAIL` controls detail eligibility independently from publication status; `CARD_ONLY` remains list-only. Structured `project_sections` are the canonical rich-detail model; `detailed_description` is a deprecated fallback.

Flyway migrations are the schema source of truth. Keep Hibernate at `ddl-auto=validate`; never use schema auto-generation as the production migration strategy. Schema changes require version-controlled migrations.

# Testing expectations

For frontend changes, run the relevant subset and normally finish with:

- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

The built-server smoke scripts are `npm run smoke:ssr` and `npm run smoke:browser`; both require a running SSR server, and the browser smoke also requires Chrome/Chromium.

Backend tests require PostgreSQL and use isolated temporary schemas. Start `postgres` with Docker Compose, then run the Maven wrapper tests. Relevant backend validation includes tests, compilation, and packaging.

When documentation-only changes are made, also run `git diff --check`, validate Markdown links and referenced paths, and confirm documented commands against current scripts/configuration.

# Repository workflow

Preserve unrelated worktree changes. Do not reset, checkout, stash, clean, revert, commit, or push unless explicitly requested. Prefer implementation-to-documentation reconciliation over changing code to satisfy stale prose.

# Docker and deployment

The production target is a Linux VPS running containerized services.

The frontend and backend must each be independently containerizable. PostgreSQL must use persistent storage. Prefer simple Docker Compose orchestration appropriate for a single-server portfolio deployment. Do not introduce Kubernetes or similar orchestration without an explicit new requirement.

Current local Compose wiring and production-style Dockerfiles exist. Host Nginx/HTTPS, image publishing, GitHub Actions, automated VPS deployment, backup/restore, rollback automation, and production monitoring are still planned; do not describe them as deployed.

# Docker images

Production Dockerfiles should:

- use appropriate multi-stage builds;
- produce minimal runtime images;
- avoid development dependencies in runtime stages;
- run applications as non-root users where practical;
- avoid embedding secrets;
- support configuration through environment variables;
- include appropriate `.dockerignore` files;
- remain reproducible from lockfiles and wrapper-managed builds.

# CI and CD

GitHub Actions is the intended CI/CD platform, but no workflow is currently implemented. Changes to `main` are intended to be automatically deployed only after that work exists.

CI must validate frontend dependency installation, formatting/linting, tests, and production build, plus backend tests, compilation, and packaging. Docker images may be published only after required validation succeeds.

Prefer immutable, Git-SHA-tagged images. Deployment must support authenticated pulls, environment-specific configuration, startup migrations, controlled updates, health verification, traceability, and reasonable rollback. Do not silently deploy a failed build.

Do not place secrets in workflow files. Use GitHub secrets or another appropriate secure mechanism, and pin important external actions to stable versions.

# Configuration and operations

Never commit production credentials or expose secrets to the Angular bundle. Document required environment variables, provide safe examples, and validate required configuration when practical. GitHub, email, or other credentialed integrations belong server-side.

For deployment work, consider service availability, health checks, PostgreSQL persistence, migration compatibility, secrets, HTTPS/reverse-proxy behavior, backups, and rollback. Do not add infrastructure complexity without a concrete benefit.
