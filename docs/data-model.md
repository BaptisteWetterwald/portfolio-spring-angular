# Data Model

This document defines the first-pass PostgreSQL model for portfolio projects and technologies.

## Principles

- Model structured project content, not a generic CMS.
- Keep locale-neutral project data separate from translated text.
- Keep project slugs stable and shareable across locales in V1.
- Use explicit constraints and indexes for data integrity.
- Keep media modelling minimal for V1.
- Allow richer case studies later without forcing V1 into a page-builder architecture.

## Implementation Status

Milestone 4 implements this V1 model through Flyway migration:

```text
backend/src/main/resources/db/migration/V1__create_project_domain.sql
```

The migration is structural only and does not seed production portfolio content. Test data is fictional and limited to repository tests.

## Entity Overview

```text
Project 1..n ProjectTranslation
Project n..m Technology
```

## Project Status Semantics

| Status | Public? | Featured? | Meaning |
| --- | --- | --- | --- |
| `DRAFT` | no | no | Private work in progress. |
| `PUBLISHED` | yes | yes | Public project, eligible for featured areas. |
| `ARCHIVED` | yes | no by default | Older or secondary project archive. |

Public APIs must exclude `DRAFT` projects.

## Tables

### `projects`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `bigserial` | yes | Primary key. |
| `slug` | `varchar(120)` | yes | Stable public slug, unique. |
| `logo_media_ref` | `varchar(500)` | no | Minimal V1 logo/media reference. |
| `github_url` | `varchar(500)` | no | Public repository URL. |
| `demo_url` | `varchar(500)` | no | Public demo URL. |
| `featured` | `boolean` | yes | Defaults to `false`; meaningful for `PUBLISHED` projects. |
| `status` | `varchar(32)` | yes | `DRAFT`, `PUBLISHED`, or `ARCHIVED`. |
| `display_order` | `integer` | yes | Defaults to `0`; lower values sort first. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |
| `updated_at` | `timestamptz` | yes | Last update timestamp. |
| `published_at` | `timestamptz` | no | Optional public publication timestamp. |

Constraints:

- `slug` unique.
- `slug` matches lowercase URL-safe format.
- `status` constrained to `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- `featured` should only be effective for `PUBLISHED` projects. This can be enforced in application logic first.
- `github_url` and `demo_url` valid URL format at application level.

### `project_translations`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `bigserial` | yes | Primary key. |
| `project_id` | `bigint` | yes | Foreign key to `projects.id`. |
| `locale` | `varchar(8)` | yes | `fr` or `en` for V1. |
| `title` | `varchar(180)` | yes | Localized project title. |
| `short_description` | `varchar(320)` | yes | Card/list summary and metadata source. |
| `detailed_description` | `text` | no | Optional case-study body. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |
| `updated_at` | `timestamptz` | yes | Last update timestamp. |

Constraints:

- unique `(project_id, locale)`;
- `locale` constrained to `fr`, `en`;
- title and short description are non-empty after trimming at application level.

### `technologies`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `bigserial` | yes | Primary key. |
| `name` | `varchar(120)` | yes | Display name, usually shared across locales. |
| `slug` | `varchar(120)` | yes | Stable technology slug, unique. |
| `icon_ref` | `varchar(500)` | no | Icon path, key, or icon identifier. |
| `category` | `varchar(80)` | no | Example: language, framework, database, tooling, platform. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |
| `updated_at` | `timestamptz` | yes | Last update timestamp. |

Constraints:

- `slug` unique;
- `name` unique unless a future need for aliases appears.

### `project_technologies`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `project_id` | `bigint` | yes | Foreign key to `projects.id`. |
| `technology_id` | `bigint` | yes | Foreign key to `technologies.id`. |
| `display_order` | `integer` | yes | Defaults to `0`. |

Constraints:

- primary key `(project_id, technology_id)`;
- indexes on both foreign keys.

## First-Pass SQL Shape

This reflects the Milestone 4 V1 migration shape.

```sql
create table projects (
  id bigserial primary key,
  slug varchar(120) not null unique,
  logo_media_ref varchar(500),
  github_url varchar(500),
  demo_url varchar(500),
  featured boolean not null default false,
  status varchar(32) not null,
  display_order integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  published_at timestamptz,
  constraint projects_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  constraint projects_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table project_translations (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  locale varchar(8) not null,
  title varchar(180) not null,
  short_description varchar(320) not null,
  detailed_description text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint project_translations_locale_check check (locale in ('fr', 'en')),
  constraint project_translations_title_not_blank check (length(btrim(title)) > 0),
  constraint project_translations_short_description_not_blank check (length(btrim(short_description)) > 0),
  constraint project_translations_project_locale_unique unique (project_id, locale)
);

create table technologies (
  id bigserial primary key,
  name varchar(120) not null unique,
  slug varchar(120) not null unique,
  icon_ref varchar(500),
  category varchar(80),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint technologies_name_not_blank check (length(btrim(name)) > 0),
  constraint technologies_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table project_technologies (
  project_id bigint not null references projects(id) on delete cascade,
  technology_id bigint not null references technologies(id) on delete restrict,
  display_order integer not null default 0,
  primary key (project_id, technology_id)
);
```

## Indexes

Recommended indexes:

- `projects(status, featured, display_order)`;
- `projects(status, display_order)`;
- `project_translations(locale)`;
- `project_technologies(technology_id)`.
- `project_technologies(project_id, display_order)` for ordered technology retrieval per project.

## Query Patterns

Public project listing:

```text
Find projects where status in (PUBLISHED, ARCHIVED), join translation for requested locale, order deterministically by display_order, published_at descending, then project id.
```

Published featured projects:

```text
Find projects where status = PUBLISHED and featured = true, join translation for requested locale, order deterministically by display_order, published_at descending, then project id.
```

Archived projects:

```text
Find projects where status = ARCHIVED, join translation for requested locale, order deterministically by display_order, published_at descending, then project id.
```

Project detail:

```text
Find project by slug where status in (PUBLISHED, ARCHIVED), join requested translation, include technologies ordered by join display_order.
```

Missing translation policy must be explicit. For SEO, returning a localized 404 is cleaner than silently showing the wrong language unless a fallback is approved.

Milestone 7 policy:

- localized list endpoints join the requested translation and omit public projects that do not have that translation;
- localized detail endpoints return 404 for missing requested translations;
- no API or frontend fallback renders another language silently;
- detail responses include `availableLocales` so the frontend can publish `hreflang` alternates only for detail pages with existing translations.

Milestone 7 fetch strategy:

- project list/detail APIs query through `ProjectTranslationEntity` for the requested locale;
- list/detail translation queries `join fetch` the owning `ProjectEntity`;
- public API ordering stays deterministic and does not group by status in the backend;
- technologies are fetched through the explicit `project_technologies` association and ordered by `display_order`, then technology name and ID;
- list APIs batch-load technologies for all returned project IDs instead of issuing one technology query per project.

Milestone 7 frontend grouping:

- Angular receives the deterministically ordered public project list and groups it for presentation into featured published, non-featured published, and archived sections;
- featured published projects are not rendered a second time in the non-featured published section;
- this grouping is a Projects page presentation concern, not a separate backend ordering contract.

## Richer Case Studies Later

V1 should allow `detailed_description` to be absent. This lets smaller archived projects exist without forcing a full case study.

Featured projects may use `detailed_description` for richer pages.

Future evolution options:

- add `project_links` for multiple external links;
- add `project_case_study_sections` for ordered sections such as context, problem, solution, results;
- add `project_metrics` if real measurable outcomes exist;
- add a full `project_media` domain for screenshots, videos, captions, and alt text if the content strategy requires it later.

Do not introduce a generic page-builder or CMS schema in V1. It would add complexity before the content model proves it needs that flexibility.
