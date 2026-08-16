# Backend Architecture

This document proposes a proportionate Spring Boot backend for the portfolio. No Spring Boot project has been initialized yet.

## Objectives

- Provide public read APIs for projects and technologies.
- Store localized project content in PostgreSQL.
- Support request-time SSR by serving project data quickly and predictably.
- Use explicit version-controlled migrations.
- Keep the backend a simple modular monolith.
- Leave room for future contact and GitHub integrations without introducing microservices.

## Architecture Style

Use one Spring Boot application with layered packages by feature.

```text
fr.bwetterwald.portfolio
  config
  common
    error
    validation
  project
    api
    application
    domain
    persistence
  technology
    api
    application
    domain
    persistence
  contact
    api
    application
  integration
    github
```

The exact Java package can be finalized during bootstrap, but it should align with `bwetterwald.fr` if practical.

## Build System

Milestone 1 uses Maven with the Maven Wrapper.

Rationale:

- Spring Initializr generated a standard Maven Spring Boot project;
- the wrapper avoids requiring a global Maven installation;
- Maven is sufficient for the current single Spring Boot backend without adding Gradle-specific complexity.

Windows bootstrap note: Apache Maven Wrapper 3.3.4's script-only `mvnw.cmd` still indexes `(Get-Item $MAVEN_M2_PATH).Target[0]` when invoked directly from PowerShell. That fails for normal Maven user homes because plain directories do not have a `Target` value. A small Windows-only compatibility patch keeps both normal directories and junction/symlink Maven homes working without machine-specific paths.

## REST API

Use a versioned API prefix:

```text
/api/v1
```

Initial public endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/projects?locale=fr|en` | List public projects: `PUBLISHED` and `ARCHIVED`. |
| `GET` | `/api/v1/projects?locale=fr|en&status=PUBLISHED` | List published projects. |
| `GET` | `/api/v1/projects?locale=fr|en&status=ARCHIVED` | List archived projects. |
| `GET` | `/api/v1/projects/featured?locale=fr|en` | List featured `PUBLISHED` projects. |
| `GET` | `/api/v1/projects/{slug}?locale=fr|en` | Fetch localized detail for `PUBLISHED` or `ARCHIVED` project. |
| `GET` | `/api/v1/technologies` | List technologies. |
| `GET` | `/api/v1/health` or Actuator health | Basic health, if not using Actuator path directly. |

`DRAFT` projects are private and must not be returned by public endpoints.

Locale should be explicit. The API may inspect `Accept-Language` as a fallback, but frontend SSR should pass locale explicitly.

## DTOs

Do not expose JPA entities directly.

Initial DTOs:

- `ProjectSummaryDto`;
- `ProjectDetailDto`;
- `TechnologyDto`;
- `ApiErrorDto`;
- future `ContactRequestDto`.

DTOs should include already-localized fields for the requested locale.

`ProjectDetailDto.detailedDescription` should be nullable or omitted when not present.

## Mapping

Manual mapping is acceptable for V1 because the domain is small.

Introduce MapStruct or another mapper only if mapping logic becomes repetitive enough to justify the dependency.

## Persistence

Use:

- PostgreSQL;
- Spring Data JPA;
- Hibernate as the JPA provider;
- Flyway for schema migrations.

Production Hibernate schema generation must remain disabled. Use `validate` or an equivalent production-safe schema mode once migrations exist.

PostgreSQL is used for this portfolio project and should not be represented as previous professional PostgreSQL experience in content.

Milestone 1 bootstrap decision: persistence dependencies may be present while database, JPA, and Flyway auto-configuration are disabled in the default application configuration. This keeps the scaffold startable before PostgreSQL and migrations exist. The exclusion must be removed or replaced with real datasource configuration when the PostgreSQL/Flyway milestone begins.

## Migrations

Use Flyway migration files committed with the backend source.

Expected migration path:

```text
V1__create_project_domain.sql
V2__seed_initial_technologies.sql
V3__add_contact_requests.sql
```

Names are examples only. The actual files should be created during implementation.

Approved V1 production strategy:

- allow Spring Boot startup migrations;
- require version-controlled migrations;
- keep Hibernate schema generation disabled in production;
- prefer backward-compatible migrations.

A dedicated migration deployment step can be introduced later if complexity justifies it.

## Validation

Use Jakarta Bean Validation for request DTOs and query parameters:

- locale must be one of `fr`, `en`;
- public status filters must be `PUBLISHED` or `ARCHIVED`;
- slugs must match the accepted slug format;
- contact fields must be validated before any email sending is added;
- optional URLs should be valid URLs when present.

Database constraints should also enforce critical invariants such as unique slugs and one translation per project per locale.

## Error Handling

Use centralized exception handling.

Expected responses:

| Case | Status |
| --- | --- |
| Unknown route | `404` |
| Unknown project slug | `404` |
| `DRAFT` project requested publicly | `404` |
| Missing translation for requested locale | `404` or fallback only by explicit policy |
| Invalid locale/query parameter | `400` |
| Invalid public status filter | `400` |
| Validation failure | `400` |
| Unexpected server error | `500` with generic public message |

API errors should be structured and avoid exposing stack traces.

## Project Domain

Project records should separate locale-neutral fields from translated content.

Locale-neutral:

- stable slug;
- logo/media reference;
- GitHub URL;
- demo URL;
- featured flag;
- status: `DRAFT`, `PUBLISHED`, `ARCHIVED`;
- display order;
- timestamps.

Localized:

- title, required;
- short description, required;
- detailed description, optional.

Technologies are shared across locales in V1.

## Future Contact Handling

Do not implement contact handling in this specification phase.

When added, contact should be backend-owned because it may require:

- email credentials;
- spam protection;
- rate limiting;
- audit/logging;
- validation;
- privacy controls.

Never expose email service secrets to the Angular frontend.

## Future GitHub Integration

Possible future use cases:

- show optional GitHub activity on Home;
- enrich project pages with repository metadata;
- show pinned repositories;
- validate GitHub URLs.

Keep this server-side if it requires API tokens. Cache GitHub responses to avoid rate-limit problems and slow page rendering.

## Caching

V1 can rely on database queries unless performance data proves otherwise.

Future caching options:

- HTTP cache headers for public project responses;
- in-memory Spring cache for project lists;
- reverse proxy cache for stable public responses;
- scheduled refresh for GitHub integration.

Avoid Redis unless a concrete need appears.

## Health and Operations

Spring Boot Actuator is appropriate if configured narrowly.

Milestone 2 decision: use Spring Boot Actuator directly at:

```text
GET /api/health
```

This keeps health public, simple, and aligned with the future same-origin `/api/*` production routing without adding duplicate application health controllers.

Expose:

- liveness;
- readiness including database connectivity;
- build/version info if safe;
- no sensitive environment details.

Nginx and the deployment process should use health endpoints to verify successful rollout.

## Security Baseline

- Public read APIs require no authentication.
- Administrative editing APIs are out of scope for V1.
- Secrets come from environment variables or mounted secret files.
- Configure CORS only if frontend and API are split across origins in development.
- Production should use same-origin `/api/*` behind Nginx and avoid broad CORS.
