# Repository architecture

This repository contains an Angular SSR frontend, a Spring Boot backend, and PostgreSQL. Treat the checked-out worktree as the implementation source of truth.

The current single-page candidate architecture is:

- `/fr`, `/en`, and `/hu` are the localized portfolio documents.
- Home, Experience, Education, Projects, and Contact are sections with stable IDs `home`, `education`, `experience`, `projects`, and `contact`.
- The GitHub activity block is supporting content after Projects and before Contact. Its optional contribution calendar follows the repository cards. It is not a sixth section or navigation target. Home contains a concise introduction, core technologies, availability, and approved CV/contact/profile links; detailed technology context belongs with experience and projects.
- Former localized section paths redirect to the corresponding fragment.
- Project `DETAIL` routes remain `/fr/projets/:slug`, `/en/projects/:slug`, and `/hu/projektek/:slug`.
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

Main-document metadata canonicalizes to `/fr`, `/en`, or `/hu`. Project detail metadata is API-derived. Unknown/private/card-only/untranslated project details return localized 404 behavior.

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

The production target is the audited Fedora `home-server-baptiste` homelab. Cloudflare owns public DNS/TLS and reaches host Nginx through the existing Cloudflare Tunnel. Nginx stays on `127.0.0.1:8008`; do not add Certbot or public host listeners. Preserve the existing `/wakommute/api/` route. The legacy portfolio remains `/srv/services/portfolio` on `8080` until the new site is staged, cut over, publicly verified, and retained through an agreed rollback window.

The frontend and backend must each be independently containerizable. PostgreSQL must use persistent storage. Prefer simple Docker Compose orchestration appropriate for a single-server portfolio deployment. Do not introduce Kubernetes or similar orchestration without an explicit new requirement.

Current local Compose wiring, production-style Dockerfiles, GitHub Actions validation, and GHCR image publishing exist. M15 repository artifacts define homelab production Compose, Cloudflare/Nginx routing, mandatory legacy backup, immutable-SHA staging/finalization, health gates, traceability, compatible-image rollback, and disabled-by-default CI SSH automation. Production is commissioned: a post-commissioning deployment and public verification of revision fd1ad0861fea38c1b20d9bccc7aba5f652d82215 succeeded on 14 September 2026. Use the installed deploy.sh deploy tooling for normal immutable-SHA releases and verify production health after each rollout. Scheduled PostgreSQL backups/restore drills, monitoring, and broader hardening remain M16.

Production routes portfolio traffic through Cloudflare Tunnel and host Nginx to the loopback-only frontend SSR server. The frontend remains the sole `/api` proxy to the private backend. For portfolio traffic Nginx must overwrite browser forwarding headers with the known public host/HTTPS scheme and Cloudflare-provided client address; the frontend trusts exactly its Nginx hop, and the backend may use native forwarding only inside this chain. First deployment requires `backup-legacy.sh`, `deploy.sh stage`, manual Nginx cutover, and `deploy.sh finalize`. Future automation may use `deploy.sh deploy` only after manual commissioning. Never automatically roll back a backend after Flyway may have changed the schema; confirm compatibility first.

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

`.github/workflows/ci.yml` validates pull requests targeting `main`, pushes to `main`, and manual runs. It publishes frontend/backend GHCR images only for validated pushes to `main`; publication is not deployment.

CI must validate frontend dependency installation, formatting/linting, tests, and production build, plus backend tests, compilation, packaging, production Compose rendering, fail-closed secret interpolation, and deployment-script SHA validation. Docker images may be published only after required validation succeeds.

Published images use the full Git SHA as the immutable tag and also receive the mutable `main` convenience tag. Deployment must select immutable SHA tags and support authenticated pulls, environment-specific configuration, startup migrations, controlled updates, health verification, traceability, and reasonable rollback. Do not silently deploy a failed build.

Do not place secrets in workflow files. GHCR publication uses the job-scoped `GITHUB_TOKEN`; application and deployment secrets are not CI inputs. Use GitHub secrets or another appropriate secure mechanism for future private values, and pin important external actions to stable versions.

# Configuration and operations

Never commit production credentials or expose secrets to the Angular bundle. Document required environment variables, provide safe examples, and validate required configuration when practical. GitHub, email, or other credentialed integrations belong server-side.

For deployment work, consider service availability, health checks, PostgreSQL persistence, migration compatibility, secrets, HTTPS/reverse-proxy behavior, backups, and rollback. Do not add infrastructure complexity without a concrete benefit.
