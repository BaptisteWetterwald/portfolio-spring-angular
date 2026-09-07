# Backend Architecture

This document describes the current Spring Boot backend. Future contact and GitHub integrations are explicitly out of scope for the implemented service.

## Current Stack

- Java 21;
- Spring Boot 4.1;
- Spring MVC public REST API;
- Spring Data JPA with Hibernate;
- Jakarta Bean Validation;
- PostgreSQL;
- Flyway;
- Maven Wrapper 3.9.16 distribution;
- Spring Boot Actuator health.

Exact managed dependency versions are defined by the Spring Boot parent in `backend/pom.xml`.

## Application Shape

The backend is one feature-oriented modular monolith under `fr.bwetterwald.portfolio`:

```text
common
  error
  persistence
project
  api
  application
  domain
  persistence
technology
  persistence
```

There are no contact, GitHub-integration, authentication, admin, or technology API modules in the current implementation.

Controllers handle HTTP binding, application services own visibility/validation/mapping policy, repositories own persistence queries, and public DTOs prevent JPA entities from leaking through the API.

## Public Endpoints

| Method | Path                                                | Behavior                                       |
| ------ | --------------------------------------------------- | ---------------------------------------------- |
| `GET`  | `/api/health`                                       | Public Actuator health endpoint                |
| `GET`  | `/api/v1/projects?locale={fr\|en}`                  | Public `PUBLISHED` and `ARCHIVED` summaries    |
| `GET`  | `/api/v1/projects?locale={fr\|en}&status=PUBLISHED` | Published summaries only                       |
| `GET`  | `/api/v1/projects?locale={fr\|en}&status=ARCHIVED`  | Archived summaries only                        |
| `GET`  | `/api/v1/projects/featured?locale={fr\|en}`         | Featured `PUBLISHED` summaries only            |
| `GET`  | `/api/v1/projects/{slug}?locale={fr\|en}`           | Localized public detail for a `DETAIL` project |

`locale` is required and limited to `fr` or `en`. Public status filters accept only `PUBLISHED` and `ARCHIVED`; `DRAFT` is rejected rather than exposed. Slugs use lowercase URL-safe validation.

There is no implemented `GET /api/v1/technologies` endpoint. Technology data is nested in project DTOs because no standalone frontend use case currently requires it.

## Visibility and Presentation

Project status answers whether a record is public:

- `DRAFT`: private and excluded from public queries;
- `PUBLISHED`: public and eligible for featured queries;
- `ARCHIVED`: public archive/secondary content.

Presentation mode independently answers whether a public detail exists:

- `CARD_ONLY`: returned by list APIs, rejected by detail lookup;
- `DETAIL`: eligible for localized detail lookup.

Unknown, draft, card-only, non-public, or untranslated detail lookups all produce public 404 behavior. Localized lists omit a public record when the requested translation does not exist; they do not fall back to another language.

## DTO Contracts

```text
ProjectSummaryDto
  slug
  title
  shortDescription
  logoMediaRef
  githubUrl
  demoUrl
  featured
  status: PUBLISHED | ARCHIVED
  presentationMode: CARD_ONLY | DETAIL
  displayOrder
  technologies[]

ProjectDetailDto
  all summary fields
  detailedDescription (nullable, deprecated fallback)
  sections[]
  availableLocales[]

ProjectSectionDto
  title
  content

TechnologyDto
  slug
  name
  iconRef
  category
```

List responses never include section bodies. Detail responses include ordered localized sections and all locales that have a project translation so the frontend can construct safe language alternates.

## Query and Mapping Strategy

`PublicProjectService` runs read-only transactions and performs manual DTO mapping through `ProjectApiMapper`. Hibernate open-in-view is disabled.

- Translation queries join-fetch their owning project for the requested locale.
- Public list order is `display_order`, then `published_at` descending, then project ID.
- Technologies are loaded in a batch for list project IDs and preserve association order.
- Detail sections are queried only for detail responses and preserve section display order.
- Public detail queries require a public status, `DETAIL` mode, slug, and requested translation.

No general application-level cache or Redis is implemented. The current database queries are proportionate to the portfolio workload.

## Persistence and Migrations

PostgreSQL is required by the default runtime and tests. Environment variables configure the datasource:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
SPRING_FLYWAY_ENABLED
```

Flyway is enabled by default and owns schema creation. Hibernate uses `spring.jpa.hibernate.ddl-auto=validate`; it does not create or update production tables.

Current migrations:

| Migration                                     | Purpose                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `V1__create_project_domain.sql`               | Projects, translations, technologies, ordered project-technology joins, indexes |
| `V2__constrain_project_media_refs.sql`        | Safe root-relative or HTTPS project media references                            |
| `V3__seed_real_portfolio_projects.sql`        | BeamNG.drive x BeepBeep 3 seed                                                  |
| `V4__add_project_presentation_mode.sql`       | `CARD_ONLY` / `DETAIL` model                                                    |
| `V5__seed_blaze4_project.sql`                 | Blaze4 seed                                                                     |
| `V6__add_project_detail_sections.sql`         | Ordered generic localized detail sections                                       |
| `V7__seed_portfolio_project.sql`              | Portfolio Spring Angular seed                                                   |
| `V8__seed_card_only_projects_and_reorder.sql` | Frequensisa, SummerCamp, Bot Discord IR, and final display order                |

The migrations contain deterministic, version-controlled public seed data. Tests use fictional fixtures in isolated temporary PostgreSQL schemas.

## Error Handling

`ApiExceptionHandler` returns compact public JSON errors and does not expose stack traces.

| Case                                           | HTTP status/code                  |
| ---------------------------------------------- | --------------------------------- |
| Unknown/private/card-only/untranslated project | `404 project_not_found`           |
| Unsupported locale                             | `400 unsupported_locale`          |
| Unsupported public status filter               | `400 invalid_project_status`      |
| Bean-validation failure                        | `400`                             |
| Unexpected failure                             | `500` with generic public message |

## Health and Container Behavior

Actuator exposes only health at `/api/health`. The Compose backend health check calls that endpoint. Because startup initializes the datasource, Flyway, and Hibernate validation, an unavailable database or invalid schema prevents a healthy backend rollout.

The backend Dockerfile uses a Maven/JDK build stage and a Java 21 JRE Alpine runtime stage. It copies only the packaged jar and runs as the non-root `spring` user.

## Testing

Backend tests cover:

- application startup;
- migrated schema constraints;
- persistence query behavior and ordering;
- public status/presentation/locale rules;
- API DTOs and error responses;
- real seed-data responses;
- isolated PostgreSQL-schema infrastructure.

Tests require a reachable PostgreSQL instance. The test support creates a unique schema, applies Flyway, validates it with Hibernate, and removes it after the run.

## Deferred Backend Work

- contact submission, email delivery, spam/rate limiting, and privacy controls;
- credentialed GitHub integration and caching;
- authentication or administrative editing;
- standalone technology endpoint;
- richer multi-item project media domain;
- production-specific observability beyond health.

Any credentialed integration must remain server-side. Same-origin production routing should avoid broad CORS.
