# Data Model

This document defines the current PostgreSQL model for portfolio projects and technologies.

## Principles

- Model structured project content, not a generic CMS.
- Keep locale-neutral project data separate from translated text.
- Keep project slugs stable and shareable across locales.
- Use explicit constraints and indexes for data integrity.
- Keep media modelling minimal until real multi-item requirements exist.
- Keep public visibility independent from whether a project has a detail page.
- Represent rich case studies with generic ordered localized sections rather than a page-builder schema.

## Out Of Scope

CV/profile content is intentionally not part of the PostgreSQL data model. Identity, biography, Home copy, Education, Professional Experience, Skills, Languages, organization/school logo references, and official organization/school links remain typed frontend-static content under `frontend/src/app/core/content`.

Do not add Education, Experience, Skill, Language, biography, or generic CMS tables unless future requirements materially change, such as runtime editing/admin, many dynamic clients, substantially more locales, or an external content-management workflow.

## Implementation Status

The current model starts with this Flyway migration:

```text
backend/src/main/resources/db/migration/V1__create_project_domain.sql
```

The V1 migration is structural only. Media-reference constraints are added by:

```text
backend/src/main/resources/db/migration/V2__constrain_project_media_refs.sql
```

The first real public project record is seeded later by:

```text
backend/src/main/resources/db/migration/V3__seed_real_portfolio_projects.sql
```

Project detail-page availability is added by:

```text
backend/src/main/resources/db/migration/V4__add_project_presentation_mode.sql
```

The second real public project record is seeded by:

```text
backend/src/main/resources/db/migration/V5__seed_blaze4_project.sql
```

Ordered localized DETAIL content sections are added by:

```text
backend/src/main/resources/db/migration/V6__add_project_detail_sections.sql
```

The current portfolio project record is seeded by:

```text
backend/src/main/resources/db/migration/V7__seed_portfolio_project.sql
```

The final current seed set and display order are completed by:

```text
backend/src/main/resources/db/migration/V8__seed_card_only_projects_and_reorder.sql
```

Test fixtures remain fictional and limited to repository tests.

## Entity Overview

```text
Project 1..n ProjectTranslation
Project 1..n ProjectSection
ProjectSection 1..n ProjectSectionTranslation
Project n..m Technology
```

## Project Status Semantics

Project status answers whether a project is publicly visible and what lifecycle state it is in. It does not decide whether a project has a dedicated detail page.

| Status      | Public? | Featured? | Meaning                                      |
| ----------- | ------- | --------- | -------------------------------------------- |
| `DRAFT`     | no      | no        | Private work in progress.                    |
| `PUBLISHED` | yes     | yes       | Public project, eligible for featured areas. |
| `ARCHIVED`  | yes     | no        | Older or secondary project archive.          |

Public APIs must exclude `DRAFT` projects.

## Project Presentation Mode Semantics

Project presentation mode answers whether a public project has a dedicated detail page. It is explicit persisted editorial data and must not be inferred from status, detailed description, media, links, technologies, or featured state.

| Presentation mode | Detail page? | Meaning                                                             |
| ----------------- | ------------ | ------------------------------------------------------------------- |
| `CARD_ONLY`       | no           | Complete public project represented by its Projects list card only. |
| `DETAIL`          | yes          | Public project with a dedicated localized detail page.              |

Status and presentation mode are independent. Examples such as `PUBLISHED` + `CARD_ONLY`, `PUBLISHED` + `DETAIL`, `ARCHIVED` + `CARD_ONLY`, and `ARCHIVED` + `DETAIL` are valid when the editorial content supports them.

The current project inventory is adequately represented by publication status, `featured`, presentation mode, and display order. Do not add another project-importance field unless approved future content demonstrates a concrete distinction that these fields cannot express.

## Tables

### `projects`

| Column              | Type           | Required | Notes                                                                                         |
| ------------------- | -------------- | -------- | --------------------------------------------------------------------------------------------- |
| `id`                | `bigserial`    | yes      | Primary key.                                                                                  |
| `slug`              | `varchar(120)` | yes      | Stable public slug, unique.                                                                   |
| `logo_media_ref`    | `varchar(500)` | no       | Current single logo/media reference: root-relative `/...` path or absolute `https://...` URL. |
| `github_url`        | `varchar(500)` | no       | Public repository URL.                                                                        |
| `demo_url`          | `varchar(500)` | no       | Public demo URL.                                                                              |
| `featured`          | `boolean`      | yes      | Defaults to `false`; meaningful for `PUBLISHED` projects.                                     |
| `status`            | `varchar(32)`  | yes      | `DRAFT`, `PUBLISHED`, or `ARCHIVED`.                                                          |
| `presentation_mode` | `varchar(32)`  | yes      | `CARD_ONLY` or `DETAIL`; controls public detail-page availability.                            |
| `display_order`     | `integer`      | yes      | Defaults to `0`; lower values sort first.                                                     |
| `created_at`        | `timestamptz`  | yes      | Creation timestamp.                                                                           |
| `updated_at`        | `timestamptz`  | yes      | Last update timestamp.                                                                        |
| `published_at`      | `timestamptz`  | no       | Optional public publication timestamp.                                                        |

Constraints:

- `slug` unique.
- `slug` matches lowercase URL-safe format.
- `status` constrained to `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- `presentation_mode` constrained to `CARD_ONLY`, `DETAIL`.
- `logo_media_ref` is nullable, or a trimmed canonical media reference using a root-relative path beginning with `/` but not `//`, or an absolute `https://` URL. Bare relative paths, protocol-relative URLs, `http://`, and unsafe schemes are rejected.
- `featured` should only be effective for `PUBLISHED` projects. This can be enforced in application logic first.
- `github_url` and `demo_url` valid URL format at application level.

### `project_translations`

| Column                 | Type           | Required | Notes                                                                                                     |
| ---------------------- | -------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `id`                   | `bigserial`    | yes      | Primary key.                                                                                              |
| `project_id`           | `bigint`       | yes      | Foreign key to `projects.id`.                                                                             |
| `locale`               | `varchar(8)`   | yes      | Current supported values are `fr` and `en`.                                                               |
| `title`                | `varchar(180)` | yes      | Localized project title.                                                                                  |
| `short_description`    | `varchar(320)` | yes      | Card/list summary and metadata source.                                                                    |
| `detailed_description` | `text`         | no       | Deprecated compatibility/fallback body. Structured DETAIL projects should use `project_sections` instead. |
| `created_at`           | `timestamptz`  | yes      | Creation timestamp.                                                                                       |
| `updated_at`           | `timestamptz`  | yes      | Last update timestamp.                                                                                    |

Constraints:

- unique `(project_id, locale)`;
- `locale` constrained to `fr`, `en`;
- title and short description are non-empty after trimming at application level.

### `project_sections`

| Column          | Type          | Required | Notes                                       |
| --------------- | ------------- | -------- | ------------------------------------------- |
| `id`            | `bigserial`   | yes      | Primary key.                                |
| `project_id`    | `bigint`      | yes      | Foreign key to `projects.id`.               |
| `display_order` | `integer`     | yes      | Defaults to `0`; lower values render first. |
| `created_at`    | `timestamptz` | yes      | Creation timestamp.                         |
| `updated_at`    | `timestamptz` | yes      | Last update timestamp.                      |

Constraints:

- foreign key to `projects(id)` with `on delete cascade`;
- unique `(project_id, display_order)` so ordering is deterministic within a project.

### `project_section_translations`

| Column       | Type           | Required | Notes                                       |
| ------------ | -------------- | -------- | ------------------------------------------- |
| `id`         | `bigserial`    | yes      | Primary key.                                |
| `section_id` | `bigint`       | yes      | Foreign key to `project_sections.id`.       |
| `locale`     | `varchar(8)`   | yes      | Current supported values are `fr` and `en`. |
| `title`      | `varchar(180)` | yes      | Localized section heading.                  |
| `content`    | `text`         | yes      | Localized section body text.                |
| `created_at` | `timestamptz`  | yes      | Creation timestamp.                         |
| `updated_at` | `timestamptz`  | yes      | Last update timestamp.                      |

Constraints:

- foreign key to `project_sections(id)` with `on delete cascade`;
- unique `(section_id, locale)`;
- `locale` constrained to `fr`, `en`;
- title and content are non-empty after trimming.

### `technologies`

| Column       | Type           | Required | Notes                                                      |
| ------------ | -------------- | -------- | ---------------------------------------------------------- |
| `id`         | `bigserial`    | yes      | Primary key.                                               |
| `name`       | `varchar(120)` | yes      | Display name, usually shared across locales.               |
| `slug`       | `varchar(120)` | yes      | Stable technology slug, unique.                            |
| `icon_ref`   | `varchar(500)` | no       | Icon path, key, or icon identifier.                        |
| `category`   | `varchar(80)`  | no       | Example: language, framework, database, tooling, platform. |
| `created_at` | `timestamptz`  | yes      | Creation timestamp.                                        |
| `updated_at` | `timestamptz`  | yes      | Last update timestamp.                                     |

Constraints:

- `slug` unique;
- `name` unique unless a future need for aliases appears.

### `project_technologies`

| Column          | Type      | Required | Notes                             |
| --------------- | --------- | -------- | --------------------------------- |
| `project_id`    | `bigint`  | yes      | Foreign key to `projects.id`.     |
| `technology_id` | `bigint`  | yes      | Foreign key to `technologies.id`. |
| `display_order` | `integer` | yes      | Defaults to `0`.                  |

Constraints:

- primary key `(project_id, technology_id)`;
- indexes on both foreign keys.

## SQL Shape

This summarizes the current project-domain shape after the V1 through V8 migrations.

```sql
create table projects (
  id bigserial primary key,
  slug varchar(120) not null unique,
  logo_media_ref varchar(500),
  github_url varchar(500),
  demo_url varchar(500),
  featured boolean not null default false,
  status varchar(32) not null,
  presentation_mode varchar(32) not null,
  display_order integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  published_at timestamptz,
  constraint projects_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  constraint projects_presentation_mode_check check (presentation_mode in ('CARD_ONLY', 'DETAIL')),
  constraint projects_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_logo_media_ref_check check (
    logo_media_ref is null
    or (
      logo_media_ref = btrim(logo_media_ref)
      and (
        logo_media_ref ~ '^/[^/[:space:]][^[:space:]]*$'
        or logo_media_ref ~ '^https://[^[:space:]]+$'
      )
    )
  )
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

create table project_sections (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (project_id, display_order)
);

create table project_section_translations (
  id bigserial primary key,
  section_id bigint not null references project_sections(id) on delete cascade,
  locale varchar(8) not null,
  title varchar(180) not null,
  content text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint project_section_translations_locale_check check (locale in ('fr', 'en')),
  constraint project_section_translations_title_not_blank check (length(btrim(title)) > 0),
  constraint project_section_translations_content_not_blank check (length(btrim(content)) > 0),
  constraint project_section_translations_section_locale_unique unique (section_id, locale)
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

## Implemented Indexes

The migrations create these indexes:

- `projects(status, featured, display_order)`;
- `projects(status, display_order)`;
- `project_translations(locale)`;
- `project_sections(project_id, display_order, id)` for ordered section retrieval per project;
- `project_section_translations(locale)`;
- `project_technologies(technology_id)`;
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
Find project by slug where status in (PUBLISHED, ARCHIVED) and presentation_mode = DETAIL, join requested translation, include technologies ordered by join display_order, and include section translations for the requested locale ordered by section display_order.
```

Missing translation policy must be explicit. For SEO, returning a localized 404 is cleaner than silently showing the wrong language unless a fallback is approved.

Current locale and visibility policy:

- localized list endpoints join the requested translation and omit public projects that do not have that translation;
- localized detail endpoints return 404 for missing requested translations;
- localized detail endpoints return 404 for public `CARD_ONLY` projects;
- no API or frontend fallback renders another language silently;
- detail responses include `availableLocales` so the frontend can publish `hreflang` alternates only for detail pages with existing translations.

Current fetch strategy:

- project list/detail APIs query through `ProjectTranslationEntity` for the requested locale;
- list/detail translation queries `join fetch` the owning `ProjectEntity`;
- public API ordering stays deterministic and does not group by status in the backend;
- public list queries include both `CARD_ONLY` and `DETAIL` projects when publication status permits them;
- public detail queries require `presentation_mode = DETAIL`;
- technologies are fetched through the explicit `project_technologies` association and ordered by `display_order`, then technology name and ID;
- structured detail sections are fetched only for detail responses and ordered by `project_sections.display_order`, then section ID;
- list APIs batch-load technologies for all returned project IDs instead of issuing one technology query per project.

Current Flyway seed data uses `projects.display_order` values `10`, `20`, `30`, `40`, `50`, and `60` for Portfolio Spring Angular, Blaze4, Frequensisa, SummerCamp, Bot Discord IR, and BeamNG.drive x BeepBeep 3 respectively.

Current frontend grouping:

- Angular receives the deterministically ordered public project list and groups it for presentation into featured published, non-featured published, and archived sections;
- featured published projects are not rendered a second time in the non-featured published section;
- this grouping is a Projects-section presentation concern, not a separate backend ordering contract.

## Richer Case Studies

`presentation_mode`, not content nullability, decides whether a public detail page exists. This lets smaller public projects exist as honest `CARD_ONLY` entries without forcing a repetitive page, while still allowing compact `DETAIL` pages when a project has meaningful case-study context.

Ordered localized `project_sections` are the canonical rich-detail content model for public `DETAIL` projects. Section titles and content are project-authored localized content, not backend enums, so Blaze4 and Portfolio Spring Angular can use their own evidence-backed narrative structures while future projects can do the same.

The existing `project_translations.detailed_description` column is retained as a deprecated staged fallback for older DETAIL records and compatibility. New rich project pages should use structured sections. Frontend rendering must prefer sections when present and must not render both sections and `detailedDescription` for the same content.

Future evolution options:

- add `project_links` for multiple external links;
- add `project_metrics` if real measurable outcomes exist;
- add a full `project_media` domain for screenshots, videos, captions, and alt text if the content strategy requires it later.

Do not introduce a generic page-builder or CMS schema without a demonstrated content requirement. It would add complexity that the current model does not need.
