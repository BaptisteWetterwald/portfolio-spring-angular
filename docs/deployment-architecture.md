# Deployment Architecture

This document defines M15 against the audited production host `home-server-baptiste`. Repository artifacts are implemented, but no backup, homelab mutation, public cutover, or live deployment has occurred.

## Status

| Capability                                           | Repository status                | Homelab status                     |
| ---------------------------------------------------- | -------------------------------- | ---------------------------------- |
| GHCR immutable-SHA images                            | Implemented and published by M14 | Not pulled for this portfolio      |
| Homelab production Compose                           | Implemented                      | Not installed or started           |
| Cloudflare/Nginx candidate configuration             | Implemented                      | Not installed                      |
| Staging, local verification, and public finalization | Implemented                      | Not executed                       |
| Legacy backup contract                               | Implemented                      | Backup not created                 |
| CI-to-homelab deployment                             | Implemented, disabled by default | Dedicated identity not provisioned |
| Backups policy, monitoring, and broader hardening    | M16                              | Not implemented                    |

## Audited Production Host

The target is a Fedora 44 x86-64 homelab with Docker 29.8.0, Compose 5.5.1, Nginx 1.30.4, Cloudflared 2026.8.3, approximately 12 GiB RAM, and approximately 930 GiB free Btrfs storage. It is compatible with M14's `linux/amd64` images.

Public DNS is proxied by Cloudflare. Cloudflare owns public HTTP-to-HTTPS behavior and the edge certificate. The host has no Nginx listener on public ports 80 or 443 and has no Certbot installation. The existing token-managed Cloudflare Tunnel reaches the host-local Nginx origin. M15 reuses that infrastructure and does not alter Tunnel or DNS configuration.

## Production Topology

```text
Internet
  |
  v
Cloudflare edge (public DNS, HTTP redirect, HTTPS certificate)
  |
  v
existing cloudflared service
  |
  v
host Nginx 127.0.0.1:8008
  |  /wakommute/api/ -> existing Wakommute 127.0.0.1:3000
  | +  |  / and /api/*
  v
Angular SSR frontend 127.0.0.1:4000
  |  /api proxy and request-time SSR data
  v
Spring Boot backend :8080 on private Docker networks
  |
  v
PostgreSQL :5432 on private Docker data network
```

Only the frontend publishes a host port, fixed to `127.0.0.1:4000`. The backend and PostgreSQL have no host ports. The existing legacy Java process on `8080`, Wakommute on `3000`, Wakommute PostgreSQL on host-loopback `5432`, and Immich resources do not collide with the new stack.

## Legacy Portfolio and Mandatory Backup

The live legacy portfolio is a non-containerized Spring Boot/Thymeleaf JAR:

- source and runtime: `/srv/services/portfolio`;
- Git remote: `git@github.com:BaptisteWetterwald/portfolio.git`;
- branch: `main`;
- audited commit: `cac4710fa420e7dbf38b469cd67c92dfc7ce1991`;
- worktree: synchronized with `origin/main`, with untracked `logs.txt`;
- ignored runtime artifact: `target/portfolio-0.0.1-SNAPSHOT.jar`;
- service: `/etc/systemd/system/portfolio.service`, running as `baptoussste`;
- upstream: `127.0.0.1:8080` through Nginx.

The application uses an in-memory H2 database and recreates project content at startup, so no legacy database dump is needed. Its source tree, built artifact, Git data, untracked log, service unit, and Nginx configuration are required for reliable restoration.

Before any Nginx replacement or legacy service stop, run [`deploy/backup-legacy.sh`](../deploy/backup-legacy.sh) manually with root privileges. It creates:

```text
/opt/portfolio-backups/legacy-<UTC timestamp>-<legacy SHA>/
```

The mode-`700` backup contains an archive-preserving source copy including `.git`, `target/`, the JAR and `logs.txt`; a Git bundle; sanitized Git identity/status metadata; copies of `portfolio.service` and `bwetterwald.conf`; safe systemd/Cloudflared metadata; a completion marker; and SHA-256 checksums.

The script records only the path, owner, and mode of `/etc/cloudflared/token` and deliberately does not copy it. Tunnel credentials and the remotely managed Cloudflare ingress configuration are a separate encrypted/private recovery concern and must never enter Git or an ordinary source backup.

## Nginx Contract

[`deploy/nginx/bwetterwald.fr.conf.example`](../deploy/nginx/bwetterwald.fr.conf.example) is a candidate replacement for `/etc/nginx/conf.d/bwetterwald.conf`. It keeps both server blocks on `127.0.0.1:8008`:

- `www.bwetterwald.fr` returns permanent `301 https://bwetterwald.fr$request_uri`;
- `bwetterwald.fr/wakommute/api/` retains the existing `http://127.0.0.1:3000/` upstream and directives;
- every other apex path goes to `http://127.0.0.1:4000`.

Nginx continues to proxy `/api/*` through Angular SSR. The frontend already owns the same-origin API proxy and reaches Spring through `BACKEND_INTERNAL_ORIGIN=http://backend:8080`; duplicating `/api` routing in Nginx would create two public proxy contracts.

There is no host TLS configuration, ACME bootstrap, certificate renewal hook, or public listener in this repository. Cloudflare continues to own public HTTPS.

## Forwarded-Header Trust

The known chain is Cloudflare edge → local Cloudflared → loopback Nginx → Angular SSR → private Spring backend.

For the portfolio location, Nginx overwrites rather than appends forwarding data:

- `Host` and `X-Forwarded-Host` use the matched public apex host;
- `X-Forwarded-Proto=https` and `X-Forwarded-Port=443` represent the Cloudflare public connection, not the local Tunnel HTTP hop;
- `X-Real-IP` and `X-Forwarded-For` use Cloudflare's `CF-Connecting-IP` header;
- the RFC `Forwarded` header is cleared.

Trusting `CF-Connecting-IP` is bounded by the Nginx listener being reachable only on loopback from the existing Cloudflare Tunnel. Opening `8008` to another network or adding another origin proxy requires re-auditing this assumption.

Express trusts exactly its nearest Nginx hop and forwards the overwritten headers to Spring. The backend remains Docker-network-only and uses `SERVER_FORWARD_HEADERS_STRATEGY=native`. Arbitrary browser-supplied forwarding chains are therefore not propagated to the Contact rate limiter.

The existing Wakommute location is intentionally unchanged and is not brought under the portfolio header contract.

## Production Compose and Secrets

[`deploy/compose.prod.yaml`](../deploy/compose.prod.yaml) uses the unique project name `portfolio-spring-angular-production`, independently scoped networks/volume, and these immutable images:

```text
ghcr.io/baptistewetterwald/portfolio-spring-angular-frontend:<full-main-git-sha>
ghcr.io/baptistewetterwald/portfolio-spring-angular-backend:<full-main-git-sha>
```

It never builds source on the host. PostgreSQL uses the project-scoped `postgres-data` named volume; neither database nor backend publishes a host port. Restart policies, dependency ordering, and health checks cover PostgreSQL, backend/Flyway startup, frontend SSR, and the proxied API.

The private environment file is expected at `/etc/portfolio-spring-angular/portfolio.env`, mode `600` or `400`. [`deploy/.env.production.example`](../deploy/.env.production.example) contains names and safe placeholders only. Production has no database-password fallback and fixes Contact delivery to SMTP, so missing database, Contact identity, or mail configuration fails before a rollout.

Private values remain PostgreSQL password, Contact identities, SMTP host/username/password, optional GitHub token, GHCR package-read credential, and future deployment SSH credentials. No secret enters browser-visible Angular configuration.

The audited `baptoussste` account has Docker access but no Docker credential configuration. The private GHCR packages therefore require a one-time package-read-only login during manual commissioning. Existing Wakommute and Immich containers, networks, volumes, and Compose projects remain unrelated and untouched.

## Staging and Finalization

[`deploy/deploy.sh`](../deploy/deploy.sh) accepts one operation and one immutable 40-character lowercase SHA.

### `stage <sha>`

This is the first-deployment entry point. It:

1. validates the command, SHA, required configuration, permissions, and rendered Compose model;
2. locks deployment operations;
3. pulls both exact application images before changing containers;
4. starts/waits for the new PostgreSQL service;
5. starts the backend, allowing Flyway and Hibernate validation to complete;
6. starts the loopback frontend only after backend health passes;
7. verifies local `/fr`, `/en`, `/api/health`, and `/en/projects/portfolio-spring-angular`;
8. records `candidate-sha` only after local success.

It never reads or changes Nginx and does not require the public domain to serve the candidate. The legacy service and public route remain live.

### `verify-local <sha>`

This read-only deployment check confirms backend/frontend container labels match the requested SHA, waits for all service health, and repeats the local SSR/API/project checks without pulling or replacing containers.

### `finalize <sha>`

Run this only after a separately approved Nginx cutover. It requires the same locally verified `candidate-sha`, repeats local checks, then verifies public `/fr`, `/en`, `/api/health`, and the representative project route. Only then does it atomically update `current-sha` and append the finalized history record.

### `deploy <sha>`

This runs `stage` followed by `finalize`. It exists only for future automation after the first manual backup, staging, Nginx cutover, and public verification have succeeded. It must not be used for initial commissioning.

State is stored below `/var/lib/portfolio-spring-angular-deployment`. Container labels show the actual running SHA; `candidate-sha` shows the locally verified candidate; `current-sha` shows the last publicly verified SHA.

## Failure Behavior

| Failure                                              | Result                                                                                                                                                                                         | Recovery boundary                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Unknown SHA, GHCR unavailable, or image pull failure | `stage` stops before any Compose update; the legacy public route and any already-running candidate remain unchanged. A partially downloaded image is harmless.                                 | Retry later or select an existing valid SHA.                                                                            |
| PostgreSQL unavailable                               | Backend/frontend update is not attempted. During initial commissioning the legacy site remains public.                                                                                         | Repair the new private database service and rerun `stage`.                                                              |
| Flyway failure or backend unhealthy                  | Backend health gate stops the rollout before frontend update and before candidate recording. The failed backend may have replaced a prior new-backend container.                               | Inspect logs and migration state; use only a schema-compatible image. Never automate database reversal.                 |
| Frontend unhealthy                                   | PostgreSQL/backend may already be on the target SHA, but candidate recording and public finalization do not occur.                                                                             | Fix or stage a compatible SHA. During initial commissioning the legacy route remains public.                            |
| Nginx upstream failure after cutover                 | Nginx can return an upstream error even though `current-sha` still identifies the prior publicly verified deployment.                                                                          | Restore the backed-up legacy Nginx file, test it, and reload Nginx.                                                     |
| Public HTTPS/API/page check failure                  | `finalize` exits without changing `current-sha`; Cloudflare/Tunnel diagnosis remains separate from the application.                                                                            | Restore the legacy Nginx route if the cutover caused the failure, then investigate without stopping the legacy service. |
| Interrupted deployment                               | The host lock is released when the process exits. Compose can be partially updated, but `candidate-sha` is written only after all local checks and `current-sha` only after all public checks. | Inspect `compose ps`, labels, and state files; rerun `stage` for the intended SHA or restore the legacy route.          |

## Rollback

Two rollback levels remain distinct:

1. **Immediate legacy rollback:** because the old Java service remains running on `8080`, restore the backed-up Nginx configuration, run privileged `nginx -t`, reload Nginx, and verify the old public root. No container or database rollback is needed.
2. **New-application rollback:** run `stage <prior-sha>`, confirm that backend is compatible with the current Flyway schema, cut/retain Nginx toward `4000`, and run `finalize <prior-sha>`.

Flyway migrations are forward operations. Selecting an older image does not reverse database changes, so automatic backend rollback is intentionally forbidden after a migration may have run. Backups, restore drills, and tested cross-migration rollback remain M16.

## CI Automation

The `deploy-production` job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) remains disabled unless repository variable `PRODUCTION_DEPLOYMENT_ENABLED` is exactly `true`. It still depends on validation and publication of the exact main-push SHA, has read-only repository permission, and uses pinned SSH host-key material. As a second guard, the combined `deploy` operation refuses to run until `current-sha` proves that one deployment was manually finalized.

When enabled after commissioning, it invokes:

```text
bash /srv/services/portfolio-spring-angular/deploy/deploy.sh deploy <github.sha>
```

The first deployment must be manual. Only after backup, staging, local checks, Nginx cutover, public finalization, and rollback verification may a dedicated non-root deployment identity and protected GitHub environment be provisioned. `baptoussste` is acceptable for supervised initial commissioning, not the final CI identity.

## Exact Manual Migration Order

1. Confirm the remote Cloudflare Tunnel ingress still targets `http://localhost:8008` for apex and `www`.
2. Install and review repository artifacts under `/srv/services/portfolio-spring-angular` without touching the legacy tree.
3. Run and verify the legacy backup under `/opt/portfolio-backups`.
4. Provision `/etc/portfolio-spring-angular/portfolio.env` privately and authenticate the commissioning user to GHCR with package-read-only access.
5. Run `deploy.sh stage <sha>` and then `verify-local <sha>` while the old site remains public.
6. Independently check Contact/SMTP and optional GitHub behavior without disclosing configuration.
7. Copy the active Nginx file again immediately before cutover, install the reviewed candidate, and run privileged `nginx -t`.
8. Reload Nginx; do not restart Cloudflared or the legacy portfolio.
9. Run `deploy.sh finalize <sha>` and verify apex, `www` redirect, API, projects, and Wakommute.
10. If verification fails, restore the legacy Nginx file and reload it.
11. Keep the legacy service and backup through an agreed rollback window.
12. Provision the dedicated CI identity and explicitly enable automation only after the manual deployment is accepted.

No step in this document is authorization to mutate the homelab.

## M15 / M16 Boundary

M15 covers the legacy safety backup, Cloudflare/Nginx cutover contract, immutable-image staging, Flyway-aware health gates, public finalization, traceability, and compatible-image/legacy rollback paths.

M16 retains scheduled PostgreSQL backups, restore drills, monitoring/alerting, comprehensive host and header hardening, exposed-port cleanup, log aggregation, and disaster-recovery exercises. Production must not be described as deployed until the manual homelab procedure has actually succeeded.
