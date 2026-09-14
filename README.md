# Baptiste Wetterwald Portfolio

I’m Baptiste Wetterwald, a software engineer focused on backend and full-stack development. I built this portfolio to share my experience, education and projects in French, English and Hungarian.

**[Visit my portfolio](https://bwetterwald.fr)** · [GitHub](https://github.com/BaptisteWetterwald) · [LinkedIn](https://www.linkedin.com/in/baptiste-wetterwald/)

I run the site on my Fedora homelab using Angular SSR, Spring Boot and PostgreSQL. Production has been commissioned; the deployment of revision `fd1ad0861fea38c1b20d9bccc7aba5f652d82215` and its public routes were verified on 14 September 2026. GitHub Actions validates changes and publishes images; I deploy immutable revisions through the existing homelab deployment script.

## Current Architecture

```text
frontend/  Angular request-time SSR application
backend/   Spring Boot public project API
docs/      Product, architecture, content, and operations documentation
```

- `/fr`, `/en` and `/hu` are the canonical localized portfolio documents.
- Each document follows this order: introduction → professional experience → education → projects → GitHub activity → contact. Navigation targets remain `#home`, `#experience`, `#education`, `#projects` and `#contact`.
- Former localized section routes such as `/fr/formation` and `/en/projects` redirect to the matching fragment.
- Public `DETAIL` projects keep dedicated localized routes at `/fr/projets/:slug`, `/en/projects/:slug` and `/hu/projektek/:slug`.
- Public `CARD_ONLY` projects appear in the Projects section but have no public detail route.
- Profile, skills, languages, education, and experience are typed, version-controlled frontend content. Projects are Spring Boot/PostgreSQL-owned content seeded through Flyway migrations.
- Angular renders all public routes at request time. Project resolvers load API data before SSR completes.
- A server-enriched GitHub activity block follows Projects, with repository cards before the contribution calendar. Anonymous REST data supplies recent repositories; an optional backend token enables the contribution calendar. It is not a primary section or navigation target.
- Contact is a localized typed reactive form in the existing `#contact` section. It posts to a backend-only delivery boundary; recipient, sender, SMTP credentials, and provider details never enter the Angular bundle or public response.

## Navigation and Visual Identity

The header and footer provide conventional section links. On wide viewports, a compact floating sonar takes over contextual navigation after the header scrolls away; the handoff observes header visibility with hysteresis. On mobile, the sonar remains available as a draggable bubble that snaps to viewport edges and opens its panel inward within the viewport. It can be dragged to the bottom of the screen, closes when I click outside it, and supports Escape. On a keyboard, two standalone taps on **Ctrl** within 450 ms open it, including while the header is visible. The shortcut ignores text fields and combinations such as Ctrl+C; the footer shows a daisyUI Kbd hint.

A single persistent floating lighthouse controls the light/dark theme independently of the header/sonar handoff. Dark mode enables its native-CSS rotating beam. Reduced-motion preferences remove smooth or looping motion while preserving static state and navigation.

I chose a restrained maritime design with dark navy and off-white surfaces, cyan navigation accents, signal red waypoints, a porthole portrait, route-style timelines, sonar feedback, anchor section permalinks, and daisyUI dividers between major sections. A slow dual aura highlights the porthole; it stays static with reduced motion. The calendar uses a compact daisyUI Stat summary, contact feedback uses Alert, and the footer repeats my GitHub, LinkedIn and contact links.

I keep important text and form labels visible. I have left rotating text, a recruitment countdown and 3D cards out of this iteration: the current content does not need them. Galleries, Diff and browser/phone mockups would be useful once I have project screenshots that demonstrate a product or a before/after change. The porthole and existing section dividers already serve their purpose.

## Stack

| Area           | Current implementation                                                                     |
| -------------- | ------------------------------------------------------------------------------------------ |
| Frontend       | Angular 22, TypeScript 6, Angular Router, request-time SSR/hydration                       |
| UI             | Tailwind CSS 4, daisyUI 5, custom CSS/SVG maritime components                              |
| Frontend tests | Angular unit-test builder with Vitest and jsdom, SSR and browser smoke scripts             |
| Backend        | Java 21, Spring Boot 4.1, Spring MVC/Mail, Spring Data JPA, Hibernate ORM, Bean Validation |
| Data           | PostgreSQL 18 in Compose, Flyway migrations, Hibernate schema validation                   |
| Runtime        | Separate multi-stage frontend and backend images plus Docker Compose                       |

The lockfile is the source of truth for exact frontend dependency versions. The Maven parent manages Spring ecosystem dependency versions.

## Public Project Model

The API exposes localized summaries and details under `/api/v1/projects`.

- `DRAFT` is private.
- `PUBLISHED` and `ARCHIVED` may appear in public lists.
- Only `DETAIL` projects resolve through the public detail endpoint and Angular detail routes.
- `CARD_ONLY` projects intentionally stop at their list card.
- Rich detail content uses ordered, generic localized sections. The older `detailedDescription` field remains a deprecated fallback.

Current Flyway seed data, in display order:

| Project                   | Status      | Presentation |
| ------------------------- | ----------- | ------------ |
| Portfolio Spring Angular  | `PUBLISHED` | `DETAIL`     |
| Blaze4                    | `PUBLISHED` | `DETAIL`     |
| Frequensisa               | `PUBLISHED` | `CARD_ONLY`  |
| SummerCamp                | `PUBLISHED` | `CARD_ONLY`  |
| Bot Discord IR            | `PUBLISHED` | `CARD_ONLY`  |
| BeamNG.drive x BeepBeep 3 | `PUBLISHED` | `CARD_ONLY`  |

## Frontend Development

Prerequisites:

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`;
- npm 11.x.

From `frontend/`:

```bash
npm ci
npm start
```

`npm start` serves the Angular development application and proxies browser `/api` requests to `http://localhost:8080`. Start the backend separately when testing project data.

Validation commands:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

To exercise the built SSR server:

```bash
npm run build
npm run serve:ssr
```

With the server running in another terminal:

```bash
npm run smoke:ssr
npm run smoke:browser
```

`smoke:browser` requires an installed Chrome/Chromium. Set `CHROME_PATH` when it is not installed in a recognized location. Both smoke scripts default to `http://127.0.0.1:4000` and support `SSR_SMOKE_ORIGIN` or `BROWSER_SMOKE_ORIGIN` overrides.

## Backend Development

Prerequisite: Java 21. Maven is provided through the wrapper.

The backend requires PostgreSQL. From the repository root, start only the database:

```bash
docker compose up -d postgres --wait
```

Then, from `backend/` on Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
.\mvnw.cmd compile
.\mvnw.cmd package
```

Safe local defaults are defined in `application.properties` and `.env.example`:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/portfolio
SPRING_DATASOURCE_USERNAME=portfolio
SPRING_DATASOURCE_PASSWORD=portfolio-local-password
SPRING_FLYWAY_ENABLED=true
PORTFOLIO_GITHUB_USERNAME=BaptisteWetterwald
PORTFOLIO_GITHUB_TOKEN=
PORTFOLIO_CONTACT_DELIVERY_MODE=log
PORTFOLIO_CONTACT_SUBJECT_PREFIX=[Contact Portfolio]
MANAGEMENT_HEALTH_MAIL_ENABLED=false
```

`BaptisteWetterwald` is the approved global GitHub identity and the backend default. `PORTFOLIO_GITHUB_USERNAME` can override it or be set to a blank value to disable the enhancement. `PORTFOLIO_GITHUB_TOKEN` is optional and stays backend-only: anonymous operation still loads recent public repositories, while a token enables GitHub GraphQL contribution-calendar data and raises REST rate limits. Use a fine-grained personal access token targeted to `BaptisteWetterwald`; GitHub's automatic read access to public repositories is sufficient for the public-only query, and no write permission is required. Do not put the token in frontend configuration or Git.

Contact defaults to the explicit development `log` sender, which records only subject/message lengths and does not deliver externally. Production must set `PORTFOLIO_CONTACT_DELIVERY_MODE=smtp` and provide `PORTFOLIO_CONTACT_RECIPIENT`, `PORTFOLIO_CONTACT_SENDER`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, and `SPRING_MAIL_PASSWORD` outside Git. `PORTFOLIO_CONTACT_SUBJECT_PREFIX` controls the fixed, single-line subject prefix and defaults to `[Contact Portfolio]`. SMTP mode validates these settings at startup. The configured sender is used as `From`, the private recipient as `To`, and the validated visitor address only as `Reply-To`. `SPRING_MAIL_TEST_CONNECTION=true` can optionally verify connectivity during startup. `MANAGEMENT_HEALTH_MAIL_ENABLED=true` can add the SMTP provider to Actuator health only after that configuration is provisioned; it remains disabled in local `log`/`disabled` modes.

Flyway is the schema source of truth. Hibernate runs with `spring.jpa.hibernate.ddl-auto=validate`. Tests create and remove isolated PostgreSQL schemas.

Public backend endpoints:

```text
GET /api/health
GET /api/v1/projects?locale=en
GET /api/v1/projects?locale=en&status=PUBLISHED
GET /api/v1/projects?locale=en&status=ARCHIVED
GET /api/v1/projects/featured?locale=en
GET /api/v1/projects/{slug}?locale=en
GET /api/v1/github/activity
POST /api/v1/contact
```

There is no standalone public technologies endpoint in the current implementation.

The GitHub endpoint exposes only a portfolio-owned activity contract: availability, profile URL, up to three recently pushed non-fork/non-archived public repositories, an optional contribution calendar containing total/date/count values, refresh time, and stale status. It uses fixed-cardinality, single-identity in-process caches with a 30-minute TTL, briefly backs off after errors, and preserves successful REST or GraphQL data independently when the other source fails.

`POST /api/v1/contact` accepts JSON `name`, `email`, `subject`, `message`, and the empty anti-bot field `organizationWebsite`. A delivered/accepted submission returns `204`. Invalid input returns `400`, rate limiting returns `429` with `Retry-After`, disabled delivery returns `503`, and an SMTP handoff failure returns `502`; error bodies use the existing `ApiErrorDto` contract and never disclose delivery configuration. Submissions are validated, sent as plain text, and never stored in PostgreSQL.

## Docker Compose

From the repository root:

```bash
docker compose build backend frontend
docker compose up -d --wait
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:4000/en
curl http://127.0.0.1:4000/api/health
docker compose down
```

| Service    | Runtime                     | Host binding     | Notes                                                                  |
| ---------- | --------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `postgres` | `postgres:18-alpine`        | `127.0.0.1:5432` | Data persists in the `postgres-data` named volume.                     |
| `backend`  | Eclipse Temurin Java 21 JRE | `127.0.0.1:8080` | Applies Flyway migrations and validates the schema.                    |
| `frontend` | Node.js 24.19.0 Angular SSR | `127.0.0.1:4000` | Uses `BACKEND_INTERNAL_ORIGIN=http://backend:8080` and proxies `/api`. |

These containers and their local Compose wiring are implemented. Production uses the separate `deploy/compose.prod.yaml`; it must not inherit these local defaults. Production is commissioned and uses the existing Nginx/Cloudflare routing and immutable-SHA rollout tooling. Backups, restore drills, monitoring, and broader hardening remain M16.

## Continuous Integration

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to `main`, and manual `workflow_dispatch` runs. Frontend, backend, and deployment-artifact validation run in parallel:

- frontend: Node.js 24.19.0, npm 11.6.2, `npm ci`, formatting, linting, unit tests, and the production SSR build;
- backend: Java 21 and `./mvnw -B verify` against a PostgreSQL 18 service using CI-only credentials and isolated Flyway-managed test schemas.
- deployment: production Compose rendering/image references, mandatory-secret failure, and deployment-shell/SHA validation.

Pull-request and manual runs build both production images for `linux/amd64` without logging in to a registry or publishing. After all validation jobs pass on a push to `main`, the workflow publishes:

```text
ghcr.io/baptistewetterwald/portfolio-spring-angular-frontend:<full-git-sha>
ghcr.io/baptistewetterwald/portfolio-spring-angular-backend:<full-git-sha>
```

Both images also receive the mutable `main` convenience tag. Deployment must select the immutable full-SHA tag; `main` is not a deployment identity. Image names are derived from the lowercased GitHub repository owner/name so forks publish only in their own namespace when their own `main` workflow is authorized.

The workflow defaults to `contents: read`. Only the trusted `main` publication job receives `packages: write`; it authenticates to GHCR with GitHub's short-lived `GITHUB_TOKEN`. The M15 production job depends on successful publication and deploys the exact `github.sha`, but is disabled unless `PRODUCTION_DEPLOYMENT_ENABLED=true` is deliberately configured. It uses a protected environment, pinned SSH host key, and dedicated deployment identity. Application and SMTP secrets never enter CI.

## Production Deployment

Production targets the audited Fedora homelab. Cloudflare owns public DNS, HTTP-to-HTTPS behavior, and TLS; the existing Cloudflare Tunnel reaches host Nginx on `127.0.0.1:8008`. Nginx preserves `/wakommute/api/` and proxies portfolio traffic to the loopback-only Angular SSR container on `4000`. The SSR server remains the sole `/api` proxy to the private Spring backend, and PostgreSQL is reachable only on a private Docker network. See [Deployment architecture](docs/deployment-architecture.md) for the host audit, trust boundary, backup requirement, phased rollout, and rollback procedure.

Repository artifacts:

```text
deploy/compose.prod.yaml                 GHCR SHA images and private service topology
deploy/.env.production.example          safe production variable names/placeholders
deploy/deploy.sh                         stage, finalize and post-commissioning deploy operations
deploy/backup-legacy.sh                  legacy safety-backup command for commissioning
deploy/nginx/bwetterwald.fr.conf.example Cloudflare-Tunnel origin/cutover candidate
```

For an already commissioned host, I first verify both GHCR image manifests, then run:

```bash
ssh homelab
cd /srv/services/portfolio-spring-angular/deploy
./deploy.sh deploy <full-git-sha>
```

I verify `current-sha`, container health, the three public languages, representative project pages, `/api/health`, GitHub activity/calendar, Nginx and Cloudflared. This normal rollout does not change Nginx, Cloudflare, secrets or the legacy portfolio. A deployment failure must be reported before any unrelated production change.

For a new host only, the first deployment uses `stage <sha>` while the legacy Java portfolio remains live on `8080`. Staging pulls exact images, waits for PostgreSQL and Flyway/backend health, starts frontend on loopback `4000`, and verifies localized SSR, API health, and a representative project without checking the public domain. After a separately approved Nginx cutover, `finalize <sha>` performs local and public checks before recording the SHA as deployed. Running the same process with a prior SHA is an application rollback only when that image is compatible with the current database schema; Flyway changes are not automatically reversed.

Before cutover, `backup-legacy.sh` must preserve `/srv/services/portfolio`, its Git/JAR/log state, the systemd unit, and the current Nginx file below `/opt/portfolio-backups`. The Cloudflare token is explicitly excluded. The current GHCR packages require authenticated pulls, so commissioning needs a package-read-only Docker credential. Production database, Contact, SMTP, optional GitHub, registry, Tunnel, and SSH secrets remain outside Git and chat. No remote operation or automation enablement is implied by these files.

## Documentation

- [Product vision](docs/product-vision.md)
- [Information architecture](docs/information-architecture.md)
- [Design system](docs/design-system.md)
- [Content inventory](docs/content-inventory.md)
- [Content strategy](docs/content-strategy.md)
- [Frontend architecture](docs/frontend-architecture.md)
- [Backend architecture](docs/backend-architecture.md)
- [Data model](docs/data-model.md)
- [SEO, i18n, and accessibility](docs/seo-i18n-accessibility.md)
- [Motion guidelines](docs/motion-guidelines.md)
- [Deployment architecture](docs/deployment-architecture.md)
- [Roadmap](docs/roadmap.md)
- [Single-page candidate record](docs/experiments/single-page-navigation.md)
