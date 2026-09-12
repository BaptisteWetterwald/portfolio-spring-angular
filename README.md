# Baptiste Wetterwald Portfolio

Bilingual portfolio for Baptiste Wetterwald, positioned as a Software Engineer focused on backend and full-stack work.

The approved baseline uses the single-page architecture described below. The application, local container stack, and CI image publication are implemented; production deployment is not yet implemented.

## Current Architecture

```text
frontend/  Angular request-time SSR application
backend/   Spring Boot public project API
docs/      Product, architecture, content, and operations documentation
```

- `/fr` and `/en` are the two canonical localized portfolio documents.
- Home, Education, Experience, Projects, and Contact are composed into each document at `#home`, `#education`, `#experience`, `#projects`, and `#contact`.
- Former localized section routes such as `/fr/formation` and `/en/projects` redirect to the matching fragment.
- Public `DETAIL` projects keep dedicated localized routes at `/fr/projets/:slug` and `/en/projects/:slug`.
- Public `CARD_ONLY` projects appear in the Projects section but have no public detail route.
- Profile, skills, languages, education, and experience are typed, version-controlled frontend content. Projects are Spring Boot/PostgreSQL-owned content seeded through Flyway migrations.
- Angular renders all public routes at request time. Project resolvers load API data before SSR completes.
- Home renders a compact server-enriched GitHub activity block after Skills/Languages. Anonymous REST data supplies recent repositories; an optional backend token enables the contribution calendar. It is not a primary section or navigation target.
- Contact is a localized typed reactive form in the existing `#contact` section. It posts to a backend-only delivery boundary; recipient, sender, SMTP credentials, and provider details never enter the Angular bundle or public response.

## Navigation and Visual Identity

The header and footer provide conventional section links. On wide viewports, a compact floating sonar takes over contextual navigation after the header scrolls away; the handoff observes header visibility with hysteresis. On mobile, the sonar remains available as a draggable bubble that snaps to viewport edges and opens its panel inward within the viewport.

A single persistent floating lighthouse controls the light/dark theme independently of the header/sonar handoff. Dark mode enables its native-CSS rotating beam. Reduced-motion preferences remove smooth or looping motion while preserving static state and navigation.

The restrained maritime design uses dark navy and off-white surfaces, cyan navigation accents, signal red waypoints, a porthole portrait, route-style timelines, sonar feedback, anchor section permalinks, and daisyUI dividers between major sections. Decorative Home waves are not part of the current design.

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

These containers and their local Compose wiring are implemented. Host Nginx/HTTPS, automated VPS deployment, backups, rollback automation, and production monitoring remain planned work.

## Continuous Integration

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to `main`, and manual `workflow_dispatch` runs. Frontend and backend validation run in parallel:

- frontend: Node.js 24.19.0, npm 11.6.2, `npm ci`, formatting, linting, unit tests, and the production SSR build;
- backend: Java 21 and `./mvnw -B verify` against a PostgreSQL 18 service using CI-only credentials and isolated Flyway-managed test schemas.

Pull-request and manual runs build both production images for `linux/amd64` without logging in to a registry or publishing. After both validation jobs pass on a push to `main`, the workflow publishes:

```text
ghcr.io/baptistewetterwald/portfolio-spring-angular-frontend:<full-git-sha>
ghcr.io/baptistewetterwald/portfolio-spring-angular-backend:<full-git-sha>
```

Both images also receive the mutable `main` convenience tag. Deployment must select the immutable full-SHA tag; `main` is not a deployment identity. Image names are derived from the lowercased GitHub repository owner/name so forks publish only in their own namespace when their own `main` workflow is authorized.

The workflow defaults to `contents: read`. Only the trusted `main` publication job receives `packages: write`; it authenticates to GHCR with GitHub's short-lived `GITHUB_TOKEN`. No manually configured CI secret, GitHub integration token, Contact identity, or SMTP credential is required. M14 stops at image publication: pulling those images onto a VPS, production Compose configuration, Nginx/HTTPS, rollout health checks, and rollback remain M15.

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
