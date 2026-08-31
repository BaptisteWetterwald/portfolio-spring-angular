# Baptiste Wetterwald Portfolio

Bilingual personal portfolio for Baptiste Wetterwald, a graduated Engineer in Computer Science and Networks.

Primary positioning:

- Software Engineer - Backend / Full-stack.

## Repository Structure

```text
frontend/  Angular SSR application
backend/   Spring Boot application
docs/      Product and architecture documentation
```

The backend now contains the PostgreSQL-backed project persistence domain, the first public localized project API, and three version-controlled real project records seeded through Flyway. The frontend now has the localized public shell, semantic navigation, locale switching, light/dark theme foundation, static sonar/compass navigation enhancement, API-backed project listing/detail pages, and the first confirmed bilingual Home, Education, Experience, and Skills content. CI/CD, production deployment, contact handling, global GitHub/LinkedIn links, richer media management, and final visual polish are still future milestones.

Milestone 2 adds only Angular to Spring Boot communication plumbing:

- Spring Boot Actuator health is public at `GET /api/health`;
- Angular calls backend APIs through the same-origin `/api` path;
- `ng serve` proxies `/api` to `http://localhost:8080` for native development;
- SSR can use `BACKEND_INTERNAL_ORIGIN` for server-side backend calls when the backend is reachable through an internal origin.

Milestone 3 adds local Docker Compose integration:

- `postgres` uses the official PostgreSQL image with a persistent named volume;
- `backend` runs the Spring Boot jar and connects to PostgreSQL through environment variables;
- `frontend` runs the built Angular request-time SSR server;
- Dockerized browser `/api/*` requests are proxied by the frontend SSR server to the backend over the Compose network.

Milestone 4 adds backend persistence for projects and technologies:

- Flyway migration `V1__create_project_domain.sql` creates the project domain schema;
- Hibernate validates the migrated schema instead of creating or mutating it;
- Spring Data JPA repositories support the future public project query patterns;
- PostgreSQL-backed repository tests use isolated temporary schemas and fictional fixture data only.

Milestone 5 adds the Angular public routing and SSR foundation:

- canonical `/fr` and `/en` route trees with localized static segments;
- `/` redirects by explicit locale preference, `Accept-Language`, then English;
- runtime UI translations without an external i18n dependency;
- localized `<title>`, descriptions, canonical URLs, `hreflang`, OpenGraph URL/title/description, and `html lang` during SSR;
- localized 404 pages with SSR HTTP 404 status where Angular server routes match a wildcard;
- a minimal accessible routing shell and placeholder pages only.

Milestone 6 adds the first real public application shell:

- a reusable localized shell with skip link, header, shell-owned main outlet, and footer;
- conventional primary navigation for Home, Education, Experience, Projects, and Contact;
- a responsive mobile menu with `aria-expanded`, Escape close behavior, and route-change closing;
- the existing locale preference flow integrated into the header;
- a light/dark theme service using `data-theme`, `localStorage`, and a non-sensitive `portfolio_theme` cookie;
- a simple lighthouse button for theme switching;
- a static SVG/CSS sonar/compass navigation enhancement around real router links.

Milestone 7 adds public project API and page rendering:

- `GET /api/v1/projects?locale=fr|en` lists public `PUBLISHED` and `ARCHIVED` projects with the requested translation;
- `GET /api/v1/projects?locale=fr|en&status=PUBLISHED|ARCHIVED` filters the public project list;
- `GET /api/v1/projects/featured?locale=fr|en` lists featured `PUBLISHED` projects only;
- `GET /api/v1/projects/{slug}?locale=fr|en` returns localized detail for a public project configured as `DETAIL`;
- `DRAFT`, unknown, and untranslated project detail requests return 404;
- Angular Projects and project detail routes resolve project data during request-time SSR and render empty/error/not-found states without inventing portfolio content.

Milestone 8 adds confirmed static portfolio content:

- Home renders Baptiste Wetterwald, Software Engineer identity, Backend / Full-stack positioning, concise bilingual introduction, primary technology directions, and Skills domains;
- Education renders ENSISA, IUT Robert Schuman, and UQAC entries with semantic date markup where dates are confirmed;
- Experience renders roles for Plansee Group Functions, Plansee, Bureau Veritas Laboratories / Bureau Veritas Laboratoires, Groupe IES, and UQAC without invented metrics or responsibilities;
- Skills are grouped by software engineering, Microsoft / enterprise applications, AI-assisted engineering, data/databases, and engineering/infrastructure, with importance levels instead of fake proficiency percentages;
- GitHub/LinkedIn links, downloadable CV, contact method, and most project records remain unimplemented until approved content exists.

A focused project data pass after Milestone 9 adds the first real public project records:

- `BeamNG.drive x BeepBeep 3` is seeded by `V3__seed_real_portfolio_projects.sql` from owner-provided repository documentation and bilingual Experience content;
- `BeamNG.drive x BeepBeep 3` is explicitly marked `CARD_ONLY` by `V4__add_project_presentation_mode.sql`;
- no GitHub URL, demo URL, or project-owned media reference is published for that project because no authoritative source for those fields exists in the repository.
- `Blaze4` is seeded by `V5__seed_blaze4_project.sql` from the canonical public repository at `https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4`;
- `Blaze4` is explicitly `PUBLISHED` + `DETAIL`, with bilingual card/detail content, the stored GitHub URL, and C#, .NET, ASP.NET Core, Blazor WebAssembly, Entity Framework Core, and SQLite technologies.

The focused Projects detail architecture pass adds ordered localized case-study sections:

- `V6__add_project_detail_sections.sql` creates `project_sections` and `project_section_translations`;
- DETAIL project rich content is now modeled as ordered localized sections instead of one long body string;
- the legacy `detailedDescription` field remains available as a deprecated compatibility/fallback field, but structured sections are the canonical model for rich DETAIL pages;
- Blaze4 is the first real structured DETAIL project and BeamNG.drive x BeepBeep 3 remains `CARD_ONLY` with no public detail route;
- `V7__seed_portfolio_project.sql` adds this current portfolio as a real `PUBLISHED` + `DETAIL` project using the current repository implementation, documentation, and git origin as the source of truth. It has bilingual structured sections, ordered technologies, the repository GitHub URL, no demo URL, no media reference, and no legacy `detailedDescription` body.
- `V8__seed_card_only_projects_and_reorder.sql` adds Frequensisa, SummerCamp, and Bot Discord IR as real `PUBLISHED` + `CARD_ONLY` projects from their canonical repositories, with bilingual card copy, GitHub actions, normalized technologies, no structured sections, and public ordering through existing `display_order` values.

## Frontend

Prerequisites:

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` compatible with Angular 22;
- npm 11.x.

Commands from `frontend/`:

```bash
npm install
npm start
npm run format:check
npm run lint
npm test
npm run build
npm run serve:ssr
```

`npm run serve:ssr` serves the built SSR output and should be run after `npm run build`.

If a local IDE runtime resolves an older Node.js version, invoke Angular through the system Node installation, for example:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\@angular\cli\bin\ng.js build
```

Representative public frontend routes:

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
/en/projects/:slug
/en/contact
```

Project detail URLs use shared slugs across locales for projects configured as `DETAIL`:

```text
/fr/projets/:slug
/en/projects/:slug
```

The public shell is rendered by SSR for localized routes. The sonar/compass and lighthouse controls are functional navigation and preference controls, the approved portrait renders in its porthole frame, Education/Experience use the M9 nautical route timeline styling, and Milestone 10 adds restrained dark-mode lighthouse beam, sonar feedback, and reduced-motion behavior.

For native development, start the backend on port `8080` and run `npm start`; frontend requests to `/api/*` are proxied to Spring Boot.

## Backend

Prerequisites:

- Java 21.

Maven is provided through the Maven Wrapper; no global Maven installation is required.

Commands from `backend/` on Windows:

```bash
cmd /c mvnw.cmd spring-boot:run
cmd /c mvnw.cmd test
cmd /c mvnw.cmd compile
cmd /c mvnw.cmd package
```

The backend now uses PostgreSQL configuration from environment variables, with safe local defaults:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/portfolio
SPRING_DATASOURCE_USERNAME=portfolio
SPRING_DATASOURCE_PASSWORD=portfolio-local-password
SPRING_FLYWAY_ENABLED=true
```

Flyway is enabled by default and is the schema source of truth. Hibernate runs with `spring.jpa.hibernate.ddl-auto=validate`.

Backend tests now require PostgreSQL. Start the Compose PostgreSQL service before running the test suite:

```bash
docker compose up -d postgres --wait
cmd /c mvnw.cmd test
```

The `test` profile points at PostgreSQL but creates per-run schemas such as `portfolio_test_<id>`, applies Flyway, validates the schema with Hibernate, and drops those schemas after the tests.

The current public connectivity endpoint is:

```text
GET http://localhost:8080/api/health
```

The current public project API endpoints are:

```text
GET http://localhost:8080/api/v1/projects?locale=en
GET http://localhost:8080/api/v1/projects?locale=en&status=PUBLISHED
GET http://localhost:8080/api/v1/projects?locale=en&status=ARCHIVED
GET http://localhost:8080/api/v1/projects/featured?locale=en
GET http://localhost:8080/api/v1/projects/{slug}?locale=en  # only for DETAIL projects; includes ordered localized sections
```

For native backend development, provide a local PostgreSQL database matching those values. The Compose `postgres` service exposes PostgreSQL on `127.0.0.1:5432` by default for this purpose.

## Docker Compose Integration

Safe local defaults are documented in `.env.example`. Copying it to `.env` is optional unless local ports or credentials need to change.

Commands from the repository root:

```bash
docker compose build backend frontend
docker compose up -d --wait
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:4000/
curl http://127.0.0.1:4000/api/health
docker compose down
```

Compose services:

| Service    | Image/runtime                                     | Host binding     | Notes                                                                                     |
| ---------- | ------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `postgres` | `postgres:18-alpine`                              | `127.0.0.1:5432` | Data persists in the `postgres-data` named volume.                                        |
| `backend`  | Spring Boot on Eclipse Temurin Java 21 JRE Alpine | `127.0.0.1:8080` | Uses `jdbc:postgresql://postgres:5432/portfolio`, runs Flyway, then validates the schema. |
| `frontend` | Angular SSR on Node.js 24.19.0 Alpine             | `127.0.0.1:4000` | Uses `BACKEND_INTERNAL_ORIGIN=http://backend:8080`.                                       |

The local host port bindings are loopback-only and exist for browser testing, native frontend proxy compatibility, native backend database access, and health validation. Production routing through host Nginx is not implemented in this milestone.

## Documentation

- [Product vision](docs/product-vision.md)
- [Content strategy](docs/content-strategy.md)
- [Content inventory](docs/content-inventory.md)
- [Information architecture](docs/information-architecture.md)
- [Design system](docs/design-system.md)
- [Frontend architecture](docs/frontend-architecture.md)
- [Backend architecture](docs/backend-architecture.md)
- [Data model](docs/data-model.md)
- [SEO, i18n, and accessibility](docs/seo-i18n-accessibility.md)
- [Motion guidelines](docs/motion-guidelines.md)
- [Deployment architecture](docs/deployment-architecture.md)
- [Roadmap](docs/roadmap.md)
