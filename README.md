# Baptiste Wetterwald Portfolio

Bilingual portfolio for Baptiste Wetterwald, positioned as a Software Engineer focused on backend and full-stack work.

The approved baseline uses the single-page architecture described below. The application and local container stack are implemented and tested locally; production deployment is not yet implemented.

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

## Navigation and Visual Identity

The header and footer provide conventional section links. On wide viewports, a compact floating sonar takes over contextual navigation after the header scrolls away; the handoff observes header visibility with hysteresis. On mobile, the sonar remains available as a draggable bubble that snaps to viewport edges and opens its panel inward within the viewport.

A single persistent floating lighthouse controls the light/dark theme independently of the header/sonar handoff. Dark mode enables its native-CSS rotating beam. Reduced-motion preferences remove smooth or looping motion while preserving static state and navigation.

The restrained maritime design uses dark navy and off-white surfaces, cyan navigation accents, signal red waypoints, a porthole portrait, route-style timelines, sonar feedback, anchor section permalinks, and daisyUI dividers between major sections. Decorative Home waves are not part of the current design.

## Stack

| Area           | Current implementation                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| Frontend       | Angular 22, TypeScript 6, Angular Router, request-time SSR/hydration                          |
| UI             | Tailwind CSS 4, daisyUI 5, custom CSS/SVG maritime components                                 |
| Frontend tests | Angular unit-test builder with Vitest and jsdom, SSR and browser smoke scripts                |
| Backend        | Java 21, Spring Boot 4.1, Spring MVC, Spring Data JPA, Hibernate ORM, Jakarta Bean Validation |
| Data           | PostgreSQL 18 in Compose, Flyway migrations, Hibernate schema validation                      |
| Runtime        | Separate multi-stage frontend and backend images plus Docker Compose                          |

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
```

`BaptisteWetterwald` is the approved global GitHub identity and the backend default. `PORTFOLIO_GITHUB_USERNAME` can override it or be set to a blank value to disable the enhancement. `PORTFOLIO_GITHUB_TOKEN` is optional and stays backend-only: anonymous operation still loads recent public repositories, while a token enables GitHub GraphQL contribution-calendar data and raises REST rate limits. Use a fine-grained personal access token targeted to `BaptisteWetterwald`; GitHub's automatic read access to public repositories is sufficient for the public-only query, and no write permission is required. Do not put the token in frontend configuration or Git.

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
```

There is no standalone public technologies endpoint in the current implementation.

The GitHub endpoint exposes only a portfolio-owned activity contract: availability, profile URL, up to three recently pushed non-fork/non-archived public repositories, an optional contribution calendar containing total/date/count values, refresh time, and stale status. It uses fixed-cardinality, single-identity in-process caches with a 30-minute TTL, briefly backs off after errors, and preserves successful REST or GraphQL data independently when the other source fails.

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

These containers and their local Compose wiring are implemented. Host Nginx/HTTPS, GHCR publishing, GitHub Actions CI/CD, automated VPS deployment, backups, rollback automation, and production monitoring remain planned work.

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
