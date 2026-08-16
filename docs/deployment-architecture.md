# Deployment Architecture

This document proposes production and development deployment architecture for the portfolio.

Primary sources: `docs/product-vision.md` and `AGENTS.md`.

## Production Target

The production target is `bwetterwald.fr` on a Linux VPS.

Approved production shape:

```text
Internet
  |
  v
Nginx on VPS host / HTTPS
  |
  +-- /       -> frontend Docker container
  |
  +-- /api/*  -> backend Docker container
                  |
                  v
               PostgreSQL Docker container
```

Use one public origin for the website and API:

```text
https://bwetterwald.fr
```

## Runtime Services

Docker Compose manages:

- frontend;
- backend;
- PostgreSQL.

Nginx runs on the VPS host as the reverse proxy and HTTPS layer unless a concrete blocker is discovered during implementation.

PostgreSQL uses persistent storage.

## Container Strategy

The frontend and backend must have separate production images.

| Image | Responsibility |
| --- | --- |
| Frontend | Run Angular request-time SSR server and serve frontend assets. |
| Backend | Run Spring Boot API and Flyway startup migrations. |
| PostgreSQL | Use official PostgreSQL image with persistent volume. |

Production images should:

- be built in CI;
- be tagged immutably, preferably with the Git commit SHA;
- avoid embedded secrets;
- use runtime environment variables for configuration;
- run as non-root where practical;
- contain only production runtime dependencies.

## Reverse Proxy Decision

Approved default: Nginx on the VPS host.

Rationale:

- common and well understood on Linux VPS deployments;
- straightforward path routing for `/` and `/api/*`;
- keeps Docker Compose focused on application services and PostgreSQL;
- works with Certbot or another ACME automation path for HTTPS.

Potential blockers to revisit:

- existing VPS image or hosting provider strongly favors another proxy;
- certificate automation becomes simpler and safer with another approved tool;
- operational requirements change beyond a single VPS.

Do not introduce Traefik, Caddy, Kubernetes, or multi-server infrastructure without a concrete new requirement.

## Nginx Routing

Conceptual routing:

```text
location / {
  proxy_pass frontend_container;
}

location /api/ {
  proxy_pass backend_container;
}
```

Implementation must preserve:

- original host and scheme headers for correct canonical URLs;
- WebSocket or streaming support only if a later feature needs it;
- request size limits appropriate for future contact forms;
- HTTPS redirects;
- security headers where appropriate.

## Docker Compose

Expected production services:

- `frontend`;
- `backend`;
- `postgres`.

Expected persistent volumes:

- PostgreSQL data volume.

Expected networking:

- frontend reachable by host Nginx;
- backend reachable by host Nginx and frontend SSR runtime;
- PostgreSQL reachable only by backend over the Docker network;
- PostgreSQL port not exposed publicly.

## Configuration

Use environment variables and safe example files.

Potential variables:

| Service | Variable Type |
| --- | --- |
| Frontend | public site URL `https://bwetterwald.fr`, backend internal URL for SSR, default locale `en`. |
| Backend | JDBC URL, database user/password, active profile, allowed origins for development, future GitHub/email tokens. |
| PostgreSQL | database name, user, password. |
| Nginx/host | domain name, upstream ports, certificate path/automation settings. |

No production secrets may be committed.

## Database Migrations

Use Flyway migrations committed with backend source.

Approved V1 production strategy:

- allow Spring Boot startup migrations;
- require version-controlled migrations;
- keep production Hibernate schema generation disabled;
- prefer backward-compatible migrations.

A dedicated migration deployment step can be introduced later if complexity justifies it.

Prefer backward-compatible migrations:

- add nullable columns before requiring data;
- deploy code that can tolerate both old and new fields where practical;
- avoid destructive schema changes without backup and explicit rollback plan.

## CI/CD Strategy

GitHub Actions is the intended CI/CD platform.

A push or merge to `main` should eventually:

1. validate frontend;
2. validate backend;
3. run tests;
4. build production artifacts;
5. build Docker images;
6. publish immutable/versioned images to GHCR;
7. deploy selected image versions to the VPS;
8. allow Spring Boot/Flyway to apply startup migrations;
9. verify application health.

Do not write the workflow until the projects exist.

## Container Registry

GitHub Container Registry is the approved default registry.

Use tags such as:

```text
ghcr.io/<owner>/<repo>-frontend:<git-sha>
ghcr.io/<owner>/<repo>-backend:<git-sha>
```

Mutable convenience tags such as `main` may exist, but deployment should record and use immutable tags.

## VPS Deployment Approach

Recommended V1 automation:

- GitHub Actions connects to the VPS over SSH;
- deployment updates selected frontend/backend image tags;
- VPS authenticates to GHCR and pulls images;
- Docker Compose recreates changed services;
- backend startup runs Flyway migrations;
- health checks verify frontend, backend, and database readiness.

Manual deployment scripts may exist as a fallback, but the intended production path is automated deployment from `main`.

## Deployment Security

Handle secrets as follows:

| Secret | Storage |
| --- | --- |
| GitHub Actions deploy SSH key | GitHub Actions secret. |
| VPS known host / host key | GitHub Actions secret or pinned repository variable if non-secret. |
| GHCR token for VPS pulls | VPS environment/credential store or GitHub Actions provisioned secret. |
| PostgreSQL password | VPS environment file or secret store, not Git. |
| Backend application secrets | VPS environment file or secret store, not Git. |
| External API tokens | Server-side only, injected into backend. |
| Future email credentials | Server-side only, injected into backend. |
| HTTPS certificates | Managed on VPS host, not Git. |

Security requirements:

- no secrets in workflow files;
- no secrets in Angular build artifacts;
- least-privilege deploy user on VPS;
- SSH key restricted to deployment where practical;
- PostgreSQL not exposed to the internet;
- HTTPS enforced at Nginx.

## Health Verification

Deployment should verify:

- Nginx responds on HTTPS;
- frontend returns a successful localized response through `/` redirect and `/en`;
- backend health endpoint is healthy through `/api/*` or internal route;
- backend can reach PostgreSQL;
- expected image tags are running.

Failed health verification should stop the deployment and report clearly.

## Rollback

Application rollback:

- keep previous frontend/backend image tags;
- keep the previous Compose environment file or deployment record;
- redeploy the previous known-good image versions;
- verify health after rollback.

Database rollback:

- do not assume image rollback reverses migrations;
- prefer backward-compatible migrations;
- take database backups before risky migrations;
- use explicit corrective migrations rather than automatic down migrations in production unless a tested policy exists.

For a single VPS, a practical rollback record can be a small deployment manifest listing image tags, migration version, timestamp, and Git commit SHA.

## Local Development

Support two workflows.

### Native Development

Use native Angular and Spring development servers when rapid feedback matters:

- Angular dev server with hot reload;
- Spring Boot dev run with local profile;
- local PostgreSQL through Docker Compose or installed PostgreSQL;
- frontend proxies `/api` to backend during development.

Milestone 2 implements the native development proxy in `frontend/proxy.conf.json`: `/api` is forwarded to `http://localhost:8080`. Browser-side production requests remain same-origin under `/api`; request-time SSR can use `BACKEND_INTERNAL_ORIGIN` when an internal backend origin is available.

Do not require Docker for every UI or backend edit if it slows normal development.

### Docker Compose Integration

Use Docker Compose for full-stack integration:

- frontend container;
- backend container;
- PostgreSQL container;
- optional local Nginx only when testing proxy behavior.

This should validate service wiring without replacing hot-reload workflows.

## Remaining Decisions

- Exact GHCR namespace and image names.
- VPS deployment user and directory layout.
- HTTPS certificate automation details for host Nginx.
- Backup schedule and retention.
- Whether a dedicated migration deployment step becomes necessary after V1.
