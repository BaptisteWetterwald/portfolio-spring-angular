# Deployment Architecture

This document distinguishes the implemented local/container runtime from the planned production deployment.

## Status Summary

| Capability                             | Status              |
| -------------------------------------- | ------------------- |
| Separate frontend/backend Dockerfiles  | Implemented         |
| Multi-stage, non-root runtime images   | Implemented         |
| Local Docker Compose integration       | Implemented         |
| PostgreSQL named-volume persistence    | Implemented locally |
| Backend/SSR health checks in Compose   | Implemented         |
| Host reverse proxy and HTTPS           | Planned             |
| GHCR image publishing                  | Planned             |
| GitHub Actions CI/CD                   | Not implemented     |
| Automated VPS deployment               | Not implemented     |
| Production backups/rollback/monitoring | Not implemented     |

No `.github/workflows` directory exists in the current repository. Nothing in this document should be read as evidence that `bwetterwald.fr` is deployed.

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

| Variable             | Default                    |
| -------------------- | -------------------------- |
| `POSTGRES_DB`        | `portfolio`                |
| `POSTGRES_USER`      | `portfolio`                |
| `POSTGRES_PASSWORD`  | `portfolio-local-password` |
| `POSTGRES_HOST_PORT` | `5432`                     |
| `BACKEND_HOST_PORT`  | `8080`                     |
| `FRONTEND_HOST_PORT` | `4000`                     |

Compose sets `SPRING_DATASOURCE_*`, enables Flyway, and sets the frontend `BACKEND_INTERNAL_ORIGIN`. The checked-in password is intentionally a local default and must not be reused for production.

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

Do not add Kubernetes, multi-server orchestration, or another proxy without a concrete requirement.

## Planned CI/CD

GitHub Actions should eventually:

1. install frontend dependencies from the lockfile;
2. run formatting, linting, tests, and production build;
3. run backend tests, compilation, and packaging;
4. build images only after validation succeeds;
5. publish immutable Git-SHA-tagged images to GHCR;
6. authenticate the VPS for image pulls;
7. update selected image versions through Compose;
8. let the backend apply compatible startup migrations;
9. verify public frontend/API health;
10. retain traceability and a reasonable application rollback path.

No workflow, registry namespace, deployment script, or VPS configuration currently implements this plan.

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

- GHCR namespace and image names;
- VPS user, directory layout, and Compose/environment-file ownership;
- exact Nginx and certificate automation;
- production secret provisioning;
- backup schedule, retention, and restore testing;
- deployment/health rollback mechanics;
- whether migration complexity eventually warrants a dedicated migration job.
