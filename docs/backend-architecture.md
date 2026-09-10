# Backend Architecture

This document describes the current Spring Boot backend, including the M11 GitHub activity and Contact delivery integrations.

## Current Stack

- Java 21;
- Spring Boot 4.1;
- Spring MVC public REST API;
- Spring Mail/Jakarta Mail SMTP delivery;
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
github
  api
  application
  client
  config
contact
  abuse
  api
  application
  config
  delivery
```

There are no authentication, admin, or technology API modules in the current implementation. GitHub and Contact are integration boundaries and neither uses persistence.

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
| `GET`  | `/api/v1/github/activity`                           | Controlled portfolio GitHub activity state     |
| `POST` | `/api/v1/contact`                                   | Validate and deliver one Contact message       |

`locale` is required and limited to `fr` or `en`. Public status filters accept only `PUBLISHED` and `ARCHIVED`; `DRAFT` is rejected rather than exposed. Slugs use lowercase URL-safe validation.

There is no implemented `GET /api/v1/technologies` endpoint. Technology data is nested in project DTOs because no standalone frontend use case currently requires it.

The GitHub endpoint accepts no username or URL parameters. Its upstream targets are the application-controlled `https://api.github.com/users/{configuredUsername}/repos` REST endpoint with fixed owner/pushed-order/page-size query parameters and the fixed `https://api.github.com/graphql` endpoint with one static contribution-calendar query.

The Contact endpoint consumes JSON `name`, `email`, `subject`, `message`, plus the empty `organizationWebsite` decoy field. Successful sender acceptance returns `204` with no body. Validation failures use `400 bad_request`; rate limiting uses `429 contact_rate_limited` plus `Retry-After`; disabled delivery uses `503 contact_unavailable`; SMTP handoff failure uses `502 contact_delivery_failed`.

## Contact Delivery

```text
ContactController -> ContactService -> ContactMessageSender -> log | disabled | SMTP
```

`ContactRequestDto` normalizes outer whitespace and line endings in its constructor before Jakarta Bean Validation runs. Limits are name 1–100, email 1–254 plus email syntax, subject 1–160, and message 20–5,000 after trimming. Single-line/header-bearing fields reject CR, LF, and NUL; message rejects NUL while retaining ordinary line breaks and Unicode.

`ContactMessageSender` prevents the controller/service contract from depending on a provider. `LoggingContactMessageSender` is the explicit local default and logs only subject/message lengths. `DisabledContactMessageSender` makes the capability return a controlled unavailable response. `SmtpContactMessageSender` builds a UTF-8 plain-text MIME message using the fixed configured sender as `From`, the private configured recipient as `To`, the validated visitor address as `Reply-To`, and a validated fixed subject prefix. It never uses visitor input as `From`, renders HTML, adds arbitrary submitted headers, or returns the SMTP/provider exception.

Spring Mail/SMTP is the production mechanism because Spring Boot provides the abstraction and auto-configuration, SMTP is supported by low-volume transactional providers, and changing providers does not change application code. A provider-specific HTTP API was considered: it can offer API-level idempotency and detailed responses, but it would add provider-specific authentication/payload/error policy while still requiring an account, secret, and verified sender domain. A full Gmail/Google Workspace mailbox is not required for either receiving at the owner's existing Gmail inbox or sending from a separately verified domain identity.

`PORTFOLIO_CONTACT_DELIVERY_MODE=smtp` requires private `PORTFOLIO_CONTACT_RECIPIENT` and fixed `PORTFOLIO_CONTACT_SENDER` identities plus Spring Mail host, port, username, and password. `PORTFOLIO_CONTACT_SUBJECT_PREFIX` defaults to `[Contact Portfolio]`; blank, multiline, NUL-containing, or overlong prefixes fail application startup in SMTP mode. Invalid/missing mandatory SMTP settings fail application startup. TLS, authentication, UTF-8, and five-second SMTP connection/read/write timeouts are the checked-in defaults. Provider credential and sender-domain DNS verification remain deployment work.

`ContactRateLimiter` is a synchronized per-process sliding window. Defaults allow five attempts per client over 15 minutes, retain at most 2,048 client entries, remove expired timestamps during requests, and evict the least-recently-used client when full. It stores salted SHA-256 address keys only; the random salt and all limiter state disappear on restart. The limiter runs before decoy handling, so invalid automated attempts cannot bypass it by filling the decoy. No Redis or database state is used.

The controller reads only `HttpServletRequest.getRemoteAddr()` and never parses `X-Forwarded-For`. Production may set `SERVER_FORWARD_HEADERS_STRATEGY=native` only when the backend is reachable solely through trusted Nginx and Nginx overwrites—not appends—forwarded client-address headers. With the safe default `none`, direct/untrusted headers cannot create limiter identities; traffic through an unconfigured proxy shares the proxy address.

Contact data is used transiently for validation, limiting, and one delivery attempt. It is not persisted in PostgreSQL. Application logs contain neither submitted name/email/subject/message content nor recipient/sender/credential/provider response. Site-wide privacy/legal copy remains an owner decision; no retention promise is invented here.

## GitHub Integration

`GitHubHttpClient` uses the Java 21 HTTP client with a two-second connection timeout, four-second request timeout, GitHub JSON media type, explicit API version, and a stable user agent. REST public-repository reads work anonymously. The official GraphQL `user(login) -> contributionsCollection -> contributionCalendar` query requires `PORTFOLIO_GITHUB_TOKEN`; it requests only `totalContributions`, `date`, and `contributionCount`. The token is sent only in backend bearer headers and is never returned, logged, placed in the GraphQL body, or included in configuration diagnostics.

The recommended token is a fine-grained personal access token targeted to `BaptisteWetterwald`. GitHub automatically gives fine-grained tokens read access to public repositories, which is sufficient for this public-only calendar query; no write permission is needed. Private/internal contribution counts are not an integration requirement and would require separately approved access (`read:user` for a classic token according to GitHub's schema reference).

`GitHubActivityService` maps only UI-required fields and constructs canonical `github.com` profile/repository URLs from the validated configured username and validated repository names. It excludes forks, archived or disabled repositories, items without a valid push timestamp, and malformed partial items. It sorts by last push and returns at most three entries.

Public contract:

```text
GitHubActivityDto
  available
  profileUrl (nullable)
  repositories[]
  contributionCalendar (nullable)
  lastRefreshedAt (nullable)
  stale

GitHubRepositoryActivityDto
  name
  url
  description (nullable)
  primaryLanguage (nullable)
  stars
  lastActivityAt

GitHubContributionCalendarDto
  totalContributions
  startsOn
  endsOn
  days[]

GitHubContributionDayDto
  date
  contributionCount
```

The cache has two fixed application-controlled component entries (repositories and contribution calendar) for one identity, is guarded by a lock, and has a 30-minute freshness TTL. Expired components refresh independently. A failed component refresh preserves its previous successful value as stale; a cold failure omits only that component. This means REST success plus GraphQL failure still returns repositories, and GraphQL success plus REST failure still returns the calendar. Both failures use a two-minute retry backoff so a failing upstream is not called once per visitor request. GitHub exceptions and response bodies never cross the public boundary.

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

No general application-level cache or Redis is implemented. The GitHub feature uses only its two fixed, single-identity in-process component entries; current database queries remain uncached and proportionate to the portfolio workload.

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
| Contact rate limit                             | `429 contact_rate_limited`        |
| Contact delivery disabled                      | `503 contact_unavailable`         |
| Contact SMTP handoff failure                   | `502 contact_delivery_failed`     |
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
- isolated PostgreSQL-schema infrastructure;
- anonymous/authenticated GitHub requests, REST/GraphQL mapping, partial failures, fixed-cardinality caching, stale fallback, and secret-safe errors.
- Contact normalization/validation boundaries, fixed sender/recipient/Reply-To semantics, delivery failures, decoy handling, bounded/expiring rate limits, proxy-header resistance, and secret-safe errors.

Tests require a reachable PostgreSQL instance. The test support creates a unique schema, applies Flyway, validates it with Hibernate, and removes it after the run.

## Deferred Backend Work

- authentication or administrative editing;
- standalone technology endpoint;
- richer multi-item project media domain;
- production-specific observability beyond health.

Any credentialed integration must remain server-side. Same-origin production routing should avoid broad CORS.
