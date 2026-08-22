# Backend Architecture

This document describes the proportionate Spring Boot backend for the portfolio.

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

### Milestone 7 Project API Implementation

Milestone 7 implements the project endpoints above except the standalone technologies endpoint, which remains deferred until a frontend use case needs it.

Implemented classes follow the documented feature-oriented structure:

```text
project
  api
    PublicProjectController
    ProjectSummaryDto
    ProjectDetailDto
    TechnologyDto
  application
    PublicProjectService
    ProjectApiMapper
    ProjectNotFoundException
    UnsupportedProjectLocaleException
    UnsupportedPublicProjectStatusException
  persistence
    ProjectTranslationRepository
    ProjectTechnologyRepository
common
  error
    ApiErrorDto
    ApiExceptionHandler
```

`PublicProjectController` only handles HTTP routing and parameter binding. `PublicProjectService` owns public visibility, locale parsing, status-filter validation, missing-translation behavior, and transactional mapping. The public API never exposes JPA entities.

The list endpoint returns public projects with the requested translation only. Public projects missing the requested translation are omitted from localized lists. Detail lookup for an unknown slug, `DRAFT` slug, non-public project, or missing requested translation returns 404.

The service accepts only `fr` and `en` locale query values and only `PUBLISHED` or `ARCHIVED` status filters. `DRAFT` is rejected as an invalid public filter and is never returned by public queries.

The featured endpoint returns only projects where `status = PUBLISHED`, `featured = true`, and the requested translation exists.

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

Milestone 7 DTO contracts:

```text
ProjectSummaryDto
  slug: string
  title: string
  shortDescription: string
  logoMediaRef: string | null
  githubUrl: string | null
  demoUrl: string | null
  featured: boolean
  status: "PUBLISHED" | "ARCHIVED"
  displayOrder: number
  technologies: TechnologyDto[]

ProjectDetailDto
  all ProjectSummaryDto fields
  detailedDescription: string | null
  availableLocales: ("fr" | "en")[]

TechnologyDto
  slug: string
  name: string
  iconRef: string | null
  category: string | null

ApiErrorDto
  status: number
  code: string
  message: string
```

`availableLocales` is included on detail responses so the frontend can emit `hreflang` alternates only for localized detail pages that actually exist.

## Mapping

Manual mapping is acceptable for V1 because the domain is small.

Introduce MapStruct or another mapper only if mapping logic becomes repetitive enough to justify the dependency.

Milestone 7 uses manual mapping in `ProjectApiMapper`. Mapping runs inside `PublicProjectService` read-only transactions because Hibernate open-in-view is disabled.

## Persistence

Use:

- PostgreSQL;
- Spring Data JPA;
- Hibernate as the JPA provider;
- Flyway for schema migrations.

Production Hibernate schema generation must remain disabled. Use `validate` or an equivalent production-safe schema mode once migrations exist.

PostgreSQL is used for this portfolio project and should not be represented as previous professional PostgreSQL experience in content.

Milestone 1 bootstrap decision: persistence dependencies may be present while database, JPA, and Flyway auto-configuration are disabled in the default application configuration. This keeps the scaffold startable before PostgreSQL and migrations exist. The exclusion must be removed or replaced with real datasource configuration when the PostgreSQL/Flyway milestone begins.

Milestone 3 implementation decision: the default application configuration now uses a real PostgreSQL datasource with environment-driven settings. JPA auto-configuration is enabled and the backend starts cleanly against an empty PostgreSQL database with zero entities and zero repositories. Hibernate schema generation is disabled with `spring.jpa.hibernate.ddl-auto=none`.

Milestone 4 implementation decision: Flyway is enabled by default with `SPRING_FLYWAY_ENABLED=true`, and the first versioned schema migration exists. Hibernate now runs with `spring.jpa.hibernate.ddl-auto=validate`; Flyway owns schema creation and Hibernate only verifies that the mapped entities match the migrated PostgreSQL schema.

The previous Milestone 3 test profile exclusions for datasource, JPA, repositories, and Flyway have been removed. Backend tests now use PostgreSQL through the same datasource defaults and create isolated temporary schemas for test runs.

## Migrations

Use Flyway migration files committed with the backend source.

Expected migration path:

```text
V1__create_project_domain.sql
V2__seed_initial_technologies.sql
V3__add_contact_requests.sql
```

Names are examples only. The actual files should be created during implementation.

Milestone 4 created:

```text
backend/src/main/resources/db/migration/V1__create_project_domain.sql
```

The V1 migration is structural only. It creates `projects`, `project_translations`, `technologies`, and `project_technologies`; no production seed data is inserted because approved real portfolio content has not been supplied.

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

Milestone 7 centralizes public API errors in `ApiExceptionHandler` and returns compact JSON bodies such as:

```json
{
  "status": 404,
  "code": "project_not_found",
  "message": "Project not found."
}
```

Unsupported locales return `400` with `unsupported_locale`; unsupported status filters return `400` with `invalid_project_status`.

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

Milestone 4 maps the persistence domain as:

```text
project
  domain
    ProjectStatus
    ProjectLocale
  persistence
    ProjectEntity
    ProjectTranslationEntity
    ProjectTechnologyEntity
    ProjectRepository
    ProjectTranslationRepository
    ProjectTechnologyRepository
technology
  persistence
    TechnologyEntity
    TechnologyRepository
```

`ProjectStatus` is persisted as a string enum. `ProjectLocale` is a small enum persisted through an attribute converter as `fr` or `en`. The project-to-technology relationship is an explicit association entity because the join table owns `display_order`.

Entity timestamps use a small JPA lifecycle callback superclass that sets `created_at` and `updated_at` on persist and updates `updated_at` on update. The migration also defines database defaults as a fallback for non-JPA inserts.

Milestone 7 public API query strategy:

- list queries select `ProjectTranslationEntity` for the requested locale and `join fetch` the owning project;
- detail queries select the requested translation for a public slug and `join fetch` the owning project;
- technologies are loaded in display order through `ProjectTechnologyRepository`;
- list endpoints batch-load technologies for all returned project IDs in one query to avoid one query per project;
- no collection fetch join is used for project technologies, avoiding `MultipleBagFetchException` and duplicate project rows.

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

Milestone 3 uses Actuator health for Docker health checks. With the default runtime datasource enabled, backend startup initializes HikariCP and Hibernate against PostgreSQL; a failed database connection makes the backend health check fail.

Nginx and the deployment process should use health endpoints to verify successful rollout.

## Security Baseline

- Public read APIs require no authentication.
- Administrative editing APIs are out of scope for V1.
- Secrets come from environment variables or mounted secret files.
- Configure CORS only if frontend and API are split across origins in development.
- Production should use same-origin `/api/*` behind Nginx and avoid broad CORS.
