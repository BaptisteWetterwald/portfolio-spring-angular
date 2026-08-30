-- Real portfolio project seed data.
-- Source: https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-29 00:00:00+00')
)
insert into projects (
  slug,
  logo_media_ref,
  github_url,
  demo_url,
  featured,
  status,
  presentation_mode,
  display_order,
  created_at,
  updated_at,
  published_at
)
select
  'blaze4',
  null,
  'https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4',
  null,
  false,
  'PUBLISHED',
  'DETAIL',
  110,
  seed_clock.seed_at,
  seed_clock.seed_at,
  null
from seed_clock
on conflict (slug) do update
set
  logo_media_ref = excluded.logo_media_ref,
  github_url = excluded.github_url,
  demo_url = excluded.demo_url,
  featured = excluded.featured,
  status = excluded.status,
  presentation_mode = excluded.presentation_mode,
  display_order = excluded.display_order,
  updated_at = excluded.updated_at,
  published_at = excluded.published_at;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-29 00:00:00+00')
),
technology_seed(name, slug) as (
  values
    ('C#', 'c-sharp'),
    ('.NET', 'dotnet'),
    ('ASP.NET Core', 'aspnet-core'),
    ('Blazor WebAssembly', 'blazor-webassembly'),
    ('Entity Framework Core', 'entity-framework-core'),
    ('SQLite', 'sqlite')
)
insert into technologies (
  name,
  slug,
  icon_ref,
  category,
  created_at,
  updated_at
)
select
  technology_seed.name,
  technology_seed.slug,
  null,
  null,
  seed_clock.seed_at,
  seed_clock.seed_at
from technology_seed
cross join seed_clock
on conflict (slug) do update
set
  name = excluded.name,
  icon_ref = excluded.icon_ref,
  category = excluded.category,
  updated_at = excluded.updated_at;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-29 00:00:00+00')
),
project_ref as (
  select id
  from projects
  where slug = 'blaze4'
),
translation_seed(locale, title, short_description, detailed_description) as (
  values
    (
      'en',
      'Blaze4',
      $$Connect Four web application built with C#/.NET using an N-tier architecture, an ASP.NET Core REST API, a Blazor WebAssembly frontend and Entity Framework Core persistence.$$,
      $$Blaze4 is a Connect Four web application developed as part of an academic project focused on N-tier architectures. Its main architectural goal was to clearly separate business logic, data access and the user interface.

The application is organized into several .NET projects: an application layer exposing an ASP.NET Core REST API, a data-access layer based on Entity Framework Core, a Blazor WebAssembly frontend, a shared DTO project and a test project.

The backend handles game creation, gameplay and turn validation. Connect Four concepts are represented through dedicated domain models, while services, repositories and mappers separate business logic, persistence and API contracts.

The application supports player registration and login using JWT authentication. Data is persisted in SQLite through Entity Framework Core and its migrations.$$
    ),
    (
      'fr',
      'Blaze4',
      $$Application web de Puissance 4 en C#/.NET, construite autour d'une architecture N-tiers avec API REST ASP.NET Core, frontend Blazor WebAssembly et persistance via Entity Framework Core.$$,
      $$Blaze4 est une application web de Puissance 4 réalisée dans le cadre d'un projet consacré aux architectures N-tiers. L'objectif principal était de séparer clairement la logique métier, l'accès aux données et l'interface utilisateur.

L'application est organisée en plusieurs projets .NET : une couche applicative exposant une API REST ASP.NET Core, une couche d'accès aux données basée sur Entity Framework Core, un frontend Blazor WebAssembly, un projet de DTOs partagés et un projet de tests.

Le backend prend en charge la création des parties, le déroulement du jeu et la validation des tours. Les concepts métier du Puissance 4 sont représentés par des modèles dédiés, tandis que des services, repositories et mappers assurent la séparation entre logique métier, persistance et contrats d'API.

L'application propose l'inscription et la connexion des joueurs avec authentification JWT. Les données sont persistées dans une base SQLite via Entity Framework Core et ses migrations.$$
    )
)
insert into project_translations (
  project_id,
  locale,
  title,
  short_description,
  detailed_description,
  created_at,
  updated_at
)
select
  project_ref.id,
  translation_seed.locale,
  translation_seed.title,
  translation_seed.short_description,
  translation_seed.detailed_description,
  seed_clock.seed_at,
  seed_clock.seed_at
from project_ref
cross join translation_seed
cross join seed_clock
on conflict (project_id, locale) do update
set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  updated_at = excluded.updated_at;

with project_ref as (
  select id
  from projects
  where slug = 'blaze4'
),
technology_seed(slug, display_order) as (
  values
    ('c-sharp', 10),
    ('dotnet', 20),
    ('aspnet-core', 30),
    ('blazor-webassembly', 40),
    ('entity-framework-core', 50),
    ('sqlite', 60)
)
insert into project_technologies (
  project_id,
  technology_id,
  display_order
)
select
  project_ref.id,
  technologies.id,
  technology_seed.display_order
from project_ref
join technology_seed on true
join technologies on technologies.slug = technology_seed.slug
on conflict (project_id, technology_id) do update
set display_order = excluded.display_order;
