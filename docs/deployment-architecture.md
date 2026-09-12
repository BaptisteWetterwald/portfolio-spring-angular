# Deployment Architecture

This document distinguishes the implemented local/container runtime and CI publication from the planned production deployment.

## Status Summary

| Capability                             | Status              |
| -------------------------------------- | ------------------- |
| Separate frontend/backend Dockerfiles  | Implemented         |
| Multi-stage, non-root runtime images   | Implemented         |
| Local Docker Compose integration       | Implemented         |
| PostgreSQL named-volume persistence    | Implemented locally |
| Backend/SSR health checks in Compose   | Implemented         |
| Host reverse proxy and HTTPS           | Planned             |
| GHCR image publishing                  | Implemented         |
| GitHub Actions CI                      | Implemented         |
| Automated VPS deployment               | Not implemented     |
| Production backups/rollback/monitoring | Not implemented     |

The implemented workflow validates code and publishes images; it does not deploy them. Nothing in this document should be read as evidence that `bwetterwald.fr` is deployed.

## Implemented Local Runtime

`compose.yaml` runs three services:

```text
browser
  |
  v
frontend Angular SSR :4000
  |  /api proxy and SSR data requests
  v
backend Spring Boot :8080
  |
  v
PostgreSQL :5432 -> postgres-data volume
```

| Service    | Image/runtime                                   | Host binding                            | Internal behavior                                                  |
| ---------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `postgres` | `postgres:18-alpine`                            | `127.0.0.1:${POSTGRES_HOST_PORT:-5432}` | Stores data at `/var/lib/postgresql` in `postgres-data`            |
| `backend`  | `portfolio-backend:local`, Java 21 JRE Alpine   | `127.0.0.1:${BACKEND_HOST_PORT:-8080}`  | Connects to `postgres:5432`, runs Flyway, validates with Hibernate |
| `frontend` | `portfolio-frontend:local`, Node 24.19.0 Alpine | `127.0.0.1:${FRONTEND_HOST_PORT:-4000}` | Uses `BACKEND_INTERNAL_ORIGIN=http://backend:8080`                 |

All host bindings are loopback-only. They support local browser access, native frontend/backend development, database tools, and health checks; they are not a public exposure design.

The frontend SSR server proxies browser-facing `/api/*` requests to `BACKEND_INTERNAL_ORIGIN`. SSR API requests use the same internal backend origin. This provides a local same-origin browser model without requiring a local Nginx container.

## Container Images

### Frontend

`frontend/Dockerfile`:

- pins Node 24.19.0 Alpine for build and runtime;
- installs the repository-declared npm 11.6.2 for the build;
- uses `npm ci` and the lockfile;
- builds the Angular server output in a separate stage;
- copies only `dist/frontend` into runtime;
- runs as non-root user `angular`;
- listens on configurable `PORT` (default 4000).

### Backend

`backend/Dockerfile`:

- uses Eclipse Temurin Java 21 JDK Alpine to resolve/build through the Maven wrapper;
- uses a Java 21 JRE Alpine runtime;
- copies only the packaged jar;
- runs as non-root user `spring`;
- listens on `SERVER_PORT` (default 8080).

Both contexts have `.dockerignore` files excluding build outputs, VCS/IDE data, local environment files, and private keys. No production credentials are embedded.

## Local Configuration

`.env.example` documents safe development defaults:

| Variable                           | Default                      |
| ---------------------------------- | ---------------------------- |
| `POSTGRES_DB`                      | `portfolio`                  |
| `POSTGRES_USER`                    | `portfolio`                  |
| `POSTGRES_PASSWORD`                | `portfolio-local-password`   |
| `POSTGRES_HOST_PORT`               | `5432`                       |
| `BACKEND_HOST_PORT`                | `8080`                       |
| `FRONTEND_HOST_PORT`               | `4000`                       |
| `PORTFOLIO_GITHUB_USERNAME`        | `BaptisteWetterwald`         |
| `PORTFOLIO_GITHUB_TOKEN`           | empty / repositories only    |
| `PORTFOLIO_CONTACT_DELIVERY_MODE`  | `log` / no external delivery |
| `PORTFOLIO_CONTACT_SUBJECT_PREFIX` | `[Contact Portfolio]`        |
| Contact rate-limit variables       | `5` / `15m` / `2048`         |
| `MANAGEMENT_HEALTH_MAIL_ENABLED`   | `false`                      |
| `SERVER_FORWARD_HEADERS_STRATEGY`  | `none`                       |

Compose sets `SPRING_DATASOURCE_*`, enables Flyway, passes backend-only GitHub/Contact configuration, and sets the frontend `BACKEND_INTERNAL_ORIGIN`. The checked-in database password is intentionally a local default and must not be reused for production. The optional GitHub token is a server-side secret and must be provisioned outside Git. Without it, anonymous REST repository activity remains enabled and the GraphQL contribution calendar is omitted.

The local Contact sender is explicitly `log`: it accepts valid requests and logs only message-length metadata without external delivery. Production must select `smtp` and privately provision `PORTFOLIO_CONTACT_RECIPIENT`, `PORTFOLIO_CONTACT_SENDER`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, and `SPRING_MAIL_PASSWORD`. `PORTFOLIO_CONTACT_SUBJECT_PREFIX` is non-secret, defaults to `[Contact Portfolio]`, and is validated as a bounded single-line header value. `SPRING_MAIL_TEST_CONNECTION` is optional. Actuator mail health is disabled by default so local `log`/`disabled` modes do not probe an unconfigured SMTP service; an SMTP deployment can set `MANAGEMENT_HEALTH_MAIL_ENABLED=true` after the provider settings are provisioned. The example file contains no address, endpoint, or credential. A transactional SMTP provider may authorize a `bwetterwald.fr` sender after DNS verification without that sender being a paid mailbox; the owner can continue receiving at an existing private Gmail inbox and later change the recipient by configuration alone.

## Local Operation

Full stack:

```bash
docker compose build backend frontend
docker compose up -d --wait
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:4000/en
curl http://127.0.0.1:4000/api/health
docker compose down
```

`docker compose down` does not remove the named volume. Removing the volume would delete local database data and is not part of the normal documented workflow.

Native development can run Angular and Spring Boot separately while using only the Compose PostgreSQL service. Angular's development proxy sends `/api` to `http://localhost:8080`.

## Health and Startup Order

- PostgreSQL health uses `pg_isready`.
- Backend waits for healthy PostgreSQL and exposes Actuator `/api/health`.
- Frontend waits for healthy backend and checks its own root response.
- Flyway migrations run during backend startup, followed by Hibernate schema validation.

This gives the local stack controlled startup and useful failure signals. It is not a complete production rollout/rollback mechanism.

## Planned Production Target

The intended target remains one Linux VPS and one public origin:

```text
Internet
  |
  v
host Nginx / HTTPS
  +-- /      -> frontend SSR container
  +-- /api/* -> backend container -> PostgreSQL container/volume
```

Host Nginx is the current preferred direction because it is proportionate to a single server and can preserve host/scheme forwarding for canonical metadata. Exact configuration, certificate automation, security headers, and upstream exposure have not been implemented.

For Contact rate limiting, the production backend must remain inaccessible from the public internet and receive `/api/*` only from trusted host Nginx. Nginx must replace the incoming client-address header (for example, `proxy_set_header X-Forwarded-For $remote_addr`) instead of appending arbitrary client input. Only then should the backend use `SERVER_FORWARD_HEADERS_STRATEGY=native`. The safe default `none` ignores forwarded headers and therefore groups proxied traffic under the proxy address. Exact Nginx implementation remains M15; this requirement does not claim it is deployed.

Do not add Kubernetes, multi-server orchestration, or another proxy without a concrete requirement.

## Implemented CI and Image Publication

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to `main`, and manual dispatches. Its two independent validation jobs enforce:

1. Node.js 24.19.0 and npm 11.6.2 installation from `frontend/package-lock.json` with `npm ci`;
2. frontend formatting, linting, unit tests, and the production request-time SSR build;
3. Java 21 Maven Wrapper `verify`, including compilation, tests, and packaging;
4. PostgreSQL 18 migration/repository tests against CI-only database credentials and per-test isolated schemas.

The test profile disables the live GitHub identity and uses metadata-only Contact logging. GitHub client tests use a loopback HTTP server and mail tests use mocks, so CI receives no GitHub application token, Contact identity, or SMTP credential. `BACKEND_INTERNAL_ORIGIN` is runtime SSR configuration and is not required by the request-time SSR build.

Both validations must succeed before an image job starts. Pull-request and manual runs build the two existing Dockerfiles for `linux/amd64` without registry authentication or publication. A push to `main` instead publishes these names:

```text
ghcr.io/baptistewetterwald/portfolio-spring-angular-frontend:<full-git-sha>
ghcr.io/baptistewetterwald/portfolio-spring-angular-backend:<full-git-sha>
```

The owner/repository portion is derived from `github.repository` and lowercased. Each successful `main` publication also moves a `main` convenience tag. The full 40-character commit SHA is the immutable deployment contract; M15 must not use the mutable tag as its sole release identity.

Workflow permissions default to `contents: read`. Only the trusted `main` push publication job has `packages: write`, logs in to `ghcr.io`, and uses GitHub's short-lived `GITHUB_TOKEN`; no PAT or manually configured CI secret is required. Pull-request code never runs in a write-capable job. Checkout credentials are not persisted. Official GitHub/Docker Actions are pinned to stable major versions.

BuildKit's GitHub Actions cache is scoped independently to `frontend` and `backend`. Untrusted image builds restore cache entries but do not write them; the trusted publication job updates them. Cache contents include no credentials and never replace lockfile/wrapper-driven dependency resolution.

## Planned Deployment

M15 remains responsible for authenticating the VPS for GHCR pulls, selecting immutable image tags in production Compose configuration, applying controlled updates, coordinating startup migrations, configuring Nginx/HTTPS, verifying public frontend/API health, recording the deployed SHA, and providing a reasonable compatible-image rollback path. No deployment script, production Compose configuration, host proxy, or VPS configuration currently implements those steps.

## Production Security and Operations Requirements

Future production work must provide:

- non-default PostgreSQL credentials outside Git;
- server-side-only application/API/email secrets;
- least-privilege deployment and GHCR credentials;
- HTTPS and verified host keys;
- PostgreSQL inaccessible from the public internet;
- explicit backup schedule and tested restore procedure;
- deployment records with Git SHA and image tags;
- compatible migration and application rollback strategy;
- logging, health monitoring, and failed-rollout handling.

Database rollback must not assume that reverting an image reverses Flyway migrations. Prefer backward-compatible migrations and corrective forward migrations.

## Remaining Decisions

- VPS user, directory layout, and Compose/environment-file ownership;
- exact Nginx and certificate automation;
- production secret provisioning;
- backup schedule, retention, and restore testing;
- deployment/health rollback mechanics;
- whether migration complexity eventually warrants a dedicated migration job.
