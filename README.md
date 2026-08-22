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

No PostgreSQL schema, CI/CD, deployment, portfolio UI, project domain, or i18n implementation exists yet.

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
SPRING_FLYWAY_ENABLED=false
```

Hibernate schema generation is disabled. Flyway remains disabled until the first versioned migration is introduced in a later milestone.

The current public connectivity endpoint is:

```text
GET http://localhost:8080/api/health
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

| Service | Image/runtime | Host binding | Notes |
| --- | --- | --- | --- |
| `postgres` | `postgres:18-alpine` | `127.0.0.1:5432` | Data persists in the `postgres-data` named volume. |
| `backend` | Spring Boot on Eclipse Temurin Java 21 JRE Alpine | `127.0.0.1:8080` | Uses `jdbc:postgresql://postgres:5432/portfolio` in Compose. |
| `frontend` | Angular SSR on Node.js 24.19.0 Alpine | `127.0.0.1:4000` | Uses `BACKEND_INTERNAL_ORIGIN=http://backend:8080`. |

The local host port bindings are loopback-only and exist for browser testing, native frontend proxy compatibility, native backend database access, and health validation. Production routing through host Nginx is not implemented in this milestone.

## Documentation

- [Product vision](docs/product-vision.md)
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
